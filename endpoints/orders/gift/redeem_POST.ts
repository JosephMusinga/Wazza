import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./redeem_POST.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "business") {
      return new Response(
        superjson.stringify({ error: "Forbidden: User is not a business owner." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const business = await db
      .selectFrom("businesses")
      .select("id")
      .where("ownerId", "=", user.id)
      .executeTakeFirst();

    if (!business) {
      return new Response(
        superjson.stringify({ error: "Forbidden: No business associated with this user." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const { orderId, redemptionCode } = schema.parse(json);

    // Find the order with the matching order ID and redemption code by joining with gift_order_metadata
    const order = await db
      .selectFrom("orders")
      .innerJoin("giftOrderMetadata", "giftOrderMetadata.orderId", "orders.id")
      .select([
        "orders.id",
        "orders.status",
        "orders.totalAmount",
        "orders.currency",
        "orders.createdAt",
        "orders.businessId",
        "giftOrderMetadata.recipientName",
        "giftOrderMetadata.recipientPhone",
        "giftOrderMetadata.recipientNationalId",
        "giftOrderMetadata.senderName",
        "giftOrderMetadata.senderPhone",
        "giftOrderMetadata.isRedeemed",
        sql<string>`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', oi.id,
                  'quantity', oi.quantity,
                  'unitPrice', oi.unit_price,
                  'totalPrice', oi.total_price,
                  'product', json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'imageUrl', p.image_url
                  )
                )
              )::text
              FROM order_items oi
              JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = orders.id
            ),
            '[]'
          )
        `.as("items"),
      ])
      .where("orders.id", "=", orderId)
      .where("giftOrderMetadata.redemptionCode", "=", redemptionCode)
      .executeTakeFirst();

    if (!order) {
      return new Response(
        superjson.stringify({ error: "Invalid Order ID and Redemption Code combination." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the order belongs to the authenticated business.
    if (order.businessId !== business.id) {
      return new Response(
        superjson.stringify({ error: "This gift order does not belong to your business." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if the gift has already been redeemed using the gift metadata table
    if (order.isRedeemed) {
      return new Response(
        superjson.stringify({ error: "This gift has already been redeemed." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify recipient information exists
    if (!order.recipientName || !order.recipientPhone || !order.recipientNationalId) {
        console.error(`Missing recipient information for order ${order.id}`);
        return new Response(
            superjson.stringify({ error: "Order is missing recipient information." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Mark the order as collected in both tables
    await db.transaction().execute(async (trx) => {
      // Update the order status
      await trx
        .updateTable("orders")
        .set({ status: "collected" })
        .where("id", "=", order.id)
        .execute();

      // Update the gift metadata to mark as redeemed
      await trx
        .updateTable("giftOrderMetadata")
        .set({ 
          isRedeemed: true,
          redeemedAt: new Date()
        })
        .where("orderId", "=", order.id)
        .execute();
    });

    // Send SMS notification to sender that their gift has been collected
    try {
      console.log(`[SMS Simulation] Sending notification to sender ${order.senderName} (${order.senderPhone})`);
      console.log(`[SMS Simulation] Message content: "Your gift for ${order.recipientName} has been collected successfully!"`);
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`[SMS Simulation] SMS sent successfully to sender ${order.senderPhone}`);
    } catch (error) {
      console.error("Failed to send SMS to sender:", error);
    }

    // Parse and process order items
    let items: any[] = [];
    try {
      if (order.items) {
        // Check if items is already an object/array (not a string)
        if (typeof order.items === 'string') {
          // If it's a string, try to parse it
          if (order.items.trim() === '') {
            items = [];
          } else if (order.items === '[object Object]') {
            console.warn(`Invalid items data for order ${order.id}: received [object Object]`);
            items = [];
          } else {
            items = JSON.parse(order.items);
          }
        } else if (Array.isArray(order.items)) {
          // If it's already an array, use it directly
          items = order.items;
        } else {
          console.warn(`Unexpected items type for order ${order.id}:`, typeof order.items, order.items);
          items = [];
        }
      }
    } catch (parseError) {
      console.error(`Failed to parse items for order ${order.id}:`, parseError, 'Raw items:', order.items);
      items = [];
    }

    const response: OutputType = {
      id: order.id,
      status: "collected", // Return the updated status
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt || new Date(),
      recipientInfo: {
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        recipientNationalId: order.recipientNationalId,
      },
      isGift: true,
      items: Array.isArray(items) ? items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
        },
      })) : [],
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error redeeming gift code:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}