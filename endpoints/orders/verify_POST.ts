import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./verify_POST.schema";
import superjson from "superjson";
import { sql } from "kysely";
import { createNotification } from "../../helpers/notificationService";

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

    const order = await db
      .selectFrom("orders")
      .leftJoin("giftOrderMetadata", "giftOrderMetadata.orderId", "orders.id")
      .leftJoin("users as buyer", "buyer.id", "orders.buyerId")
      .leftJoin("businesses", "businesses.id", "orders.businessId")
      .select([
        "orders.id",
        "orders.status",
        "orders.totalAmount",
        "orders.currency",
        "orders.createdAt",
        "orders.businessId",
        "orders.buyerId",
        "orders.redemptionCode as regularRedemptionCode",
        "giftOrderMetadata.id as giftMetadataId",
        "giftOrderMetadata.redemptionCode as giftRedemptionCode",
        "giftOrderMetadata.recipientName",
        "giftOrderMetadata.recipientPhone",
        "giftOrderMetadata.recipientNationalId",
        "buyer.displayName as buyerName",
        "buyer.email as buyerEmail",
        "buyer.phone as buyerPhone",
        "buyer.nationalId as buyerNationalId",
        "businesses.businessName",
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
      .executeTakeFirst();

    if (!order) {
      return new Response(
        superjson.stringify({ error: "Order not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (order.businessId !== business.id) {
      return new Response(
        superjson.stringify({ error: "This order does not belong to your business." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const isGift = !!order.giftMetadataId;
    const correctCode = isGift ? order.giftRedemptionCode : order.regularRedemptionCode;

    if (correctCode !== redemptionCode) {
      return new Response(
        superjson.stringify({ error: "Invalid redemption code." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (order.status === "collected") {
      return new Response(
        superjson.stringify({ error: "This order has already been collected." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("orders")
        .set({ status: "collected" })
        .where("id", "=", order.id)
        .execute();

      if (isGift) {
        await trx
          .updateTable("giftOrderMetadata")
          .set({ 
            isRedeemed: true,
            redeemedAt: new Date()
          })
          .where("orderId", "=", order.id)
          .execute();
      }

      // Send notification to buyer when order status changes from pending to collected
      if (order.status === "pending" && order.buyerId) {
        await createNotification(trx, {
          recipientId: order.buyerId,
          recipientType: 'user',
          type: 'order_completed',
          title: 'Order Collected!',
          message: `Your order from ${order.businessName || 'the business'} has been successfully collected.`,
          data: {
            orderId: order.id,
            businessName: order.businessName || 'Unknown Business'
          }
        });
      }
    });

    let items: any[] = [];
    try {
      if (typeof order.items === 'string') {
        items = JSON.parse(order.items);
      } else if (Array.isArray(order.items)) {
        items = order.items;
      }
    } catch (parseError) {
      console.error(`Failed to parse items for order ${order.id}:`, parseError, 'Raw items:', order.items);
      items = [];
    }

    const response: OutputType = {
      id: order.id,
      status: "collected",
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt || new Date(),
      isGift,
      recipientInfo: isGift ? {
        recipientName: order.recipientName || '',
        recipientPhone: order.recipientPhone || '',
        recipientNationalId: order.recipientNationalId || '',
      } : undefined,
      buyerInfo: !isGift ? {
        buyerName: order.buyerName || '',
        buyerEmail: order.buyerEmail || '',
        buyerPhone: order.buyerPhone || '',
        buyerNationalId: order.buyerNationalId || '',
      } : undefined,
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
    console.error("Error verifying order:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}