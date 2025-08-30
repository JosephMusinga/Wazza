import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema, OutputType } from "./orders_GET.schema";
import { OrderStatus } from '../helpers/schema';
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    // Any authenticated user can view their own orders.
    if (!user) {
      return new Response(
        superjson.stringify({ error: "Unauthorized: You must be logged in to view your orders." }),
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 10
    };

    const validatedInput = schema.parse(queryParams);
    const { page, limit } = validatedInput;
    const offset = (page - 1) * limit;

    const baseQuery = db.
    selectFrom("orders").
    where("orders.buyerId", "=", user.id);

    const totalResult = await baseQuery.
    select(db.fn.count("orders.id").as("count")).
    executeTakeFirst();
    const total = Number(totalResult?.count ?? 0);

    if (total === 0) {
      const response: OutputType = { orders: [], total: 0, page, limit };
      return new Response(superjson.stringify(response), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const ordersResult = await db.
    selectFrom("orders").
    innerJoin("businesses", "businesses.id", "orders.businessId").
    leftJoin("giftOrderMetadata as gom", "gom.orderId", "orders.id").
    select([
    "orders.id",
    "orders.status",
    "orders.totalAmount",
    "orders.currency",
    "orders.createdAt",
    "orders.updatedAt",
    "businesses.id as businessId",
    "businesses.businessName",
    "orders.redemptionCode as regularRedemptionCode",
    "gom.redemptionCode",
    "gom.recipientName",
    "gom.recipientPhone",
    "gom.recipientNationalId",
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
        `.as("items")]
    ).
    where("orders.buyerId", "=", user.id).
    orderBy("orders.createdAt", "desc").
    limit(limit).
    offset(offset).
    execute();

    const orders = ordersResult.map((order: {
      id: number;
      status: OrderStatus;
      totalAmount: string;
      currency: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      businessId: number;
      businessName: string;
      regularRedemptionCode: string | null;
      redemptionCode: string | null;
      recipientName: string | null;
      recipientPhone: string | null;
      recipientNationalId: string | null;
      items: string;
    }) => {
      let items: any[] = [];
      try {
        if (order.items && typeof order.items === 'string') {
          items = JSON.parse(order.items);
        } else if (Array.isArray(order.items)) {
          items = order.items;
        }
      } catch (parseError) {
        console.error(`Failed to parse items for order ${order.id}:`, parseError, 'Raw items:', order.items);
        items = [];
      }

      return {
        id: order.id,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        createdAt: order.createdAt || new Date(),
        updatedAt: order.updatedAt || new Date(),
        business: {
          id: order.businessId,
          name: order.businessName
        },
        items: Array.isArray(items) ? items.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        })) : [],
        isGift: !!order.recipientName, // Gift orders have recipient metadata
        redemptionCode: order.redemptionCode || order.regularRedemptionCode || undefined,
        recipientName: order.recipientName || undefined,
        recipientPhone: order.recipientPhone || undefined,
        recipientNationalId: order.recipientNationalId || undefined
      };
    });

    const response: OutputType = { orders, total, page, limit };
    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}