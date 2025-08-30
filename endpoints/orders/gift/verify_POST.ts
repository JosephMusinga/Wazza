import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./verify_POST.schema";
import superjson from "superjson";
import { sql } from "kysely";
import { Selectable } from "kysely";
import { Orders } from "../../../helpers/schema";

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

    if (order.businessId !== business.id) {
      return new Response(
        superjson.stringify({ error: "This gift order does not belong to your business." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!order.recipientName || !order.recipientPhone || !order.recipientNationalId) {
        console.error(`Missing recipient information for order ${order.id}`);
        return new Response(
            superjson.stringify({ error: "Order is missing recipient information." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

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
      status: order.status as Selectable<Orders>['status'],
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt || new Date(),
      recipientInfo: {
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        recipientNationalId: order.recipientNationalId,
      },
      isGift: true,
      isRedeemed: !!order.isRedeemed,
      items: items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
        },
      })),
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error verifying gift code:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}