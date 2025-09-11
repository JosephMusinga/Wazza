import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./orders_GET.schema";
import { OrderStatus } from "../../helpers/schema";
import superjson from "superjson";
import { sql } from "kysely";

// Type definitions for the query results
interface FilteredOrdersRow {
  id: number;
  status: OrderStatus;
  totalAmount: string;
  currency: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  giftOrderId: number | null;
  buyerDisplayName: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  totalCount: number;
}

interface OrderItemData {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
  };
}

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "business") {
      return new Response(
        superjson.stringify({ error: "Forbidden: User is not a business owner." }),
        { status: 403 }
      );
    }

    const business = await db
      .selectFrom("businesses")
      .select("id")
      .where("ownerId", "=", user.id)
      .executeTakeFirst();

    // Security logging for audit trail
    console.log(`[SECURITY] Business Orders Request - User: ${user.id} (${user.email}) accessing business: ${business?.id}`);

    if (!business) {
      console.error('🚨 SECURITY ALERT: User attempted to access business orders without owning a business', {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      });
      return new Response(
        superjson.stringify({ error: "Forbidden: No business associated with this user." }),
        { status: 403 }
      );
    }

    // CRITICAL SECURITY CHECK: Double-verify business ownership
    const ownershipVerification = await db
      .selectFrom("businesses")
      .select("id")
      .where("id", "=", business.id)
      .where("ownerId", "=", user.id)
      .where("status", "=", "active")
      .executeTakeFirst();

    if (!ownershipVerification) {
      console.error('🚨 CRITICAL SECURITY BREACH: User attempted to access orders for business they do not own!', {
        userId: user.id,
        userEmail: user.email,
        attemptedBusinessId: business.id,
        timestamp: new Date().toISOString()
      });
      return new Response(
        superjson.stringify({ error: "Forbidden: You do not have access to this business data." }),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 10,
      status: url.searchParams.get("status") || undefined,
      sortBy: url.searchParams.get("sortBy") || "createdAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
      isGift: url.searchParams.get("isGift") ? url.searchParams.get("isGift") === "true" : undefined,
    };

    const validatedInput = schema.parse(queryParams);
    const { page, limit, status, sortBy, sortOrder, isGift } = validatedInput;
    const offset = (page - 1) * limit;

    // Single optimized query using window function for count and correlated subquery for items
    let baseQuery = db
      .selectFrom("orders")
      .leftJoin("giftOrderMetadata", "giftOrderMetadata.orderId", "orders.id")
      .leftJoin("users", "users.id", "orders.buyerId")
      .select([
        "orders.id",
        "orders.status", 
        "orders.totalAmount",
        "orders.currency",
        "orders.createdAt",
        "orders.updatedAt",
        "giftOrderMetadata.orderId as giftOrderId",
        "users.displayName as buyerDisplayName",
        "giftOrderMetadata.recipientName",
        "giftOrderMetadata.recipientPhone",
        sql<number>`count(*) over()`.as('totalCount'),
        // Correlated subquery for items aggregation
        sql<OrderItemData[]>`(
          SELECT COALESCE(
            json_agg(
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
            ), 
            '[]'::json
          )
          FROM order_items oi
          INNER JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = orders.id
        )`.as('items')
      ])
      .where("orders.businessId", "=", business.id);

    if (status) {
      baseQuery = baseQuery.where("orders.status", "=", status);
    }

    if (isGift !== undefined) {
      if (isGift) {
        baseQuery = baseQuery.where("giftOrderMetadata.orderId", "is not", null);
      } else {
        baseQuery = baseQuery.where("giftOrderMetadata.orderId", "is", null);
      }
    }

    const result = await baseQuery
      .orderBy(
        sql`
          CASE orders.status 
            WHEN 'pending' THEN 1 
            WHEN 'collected' THEN 2 
            WHEN 'cancelled' THEN 3 
            ELSE 4 
          END
        `, 
        'asc'
      )
      .orderBy(`orders.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset)
      .execute() as Array<FilteredOrdersRow & { items: OrderItemData[] }>;

    // Security validation - log order access for audit
    console.log(`[SECURITY] Orders Retrieved - User: ${user.id}, Business: ${business.id}, Orders: [${result.map(o => o.id).join(', ')}]`);

    if (result.length === 0) {
      const response: OutputType = { orders: [], total: 0, page, limit };
      return new Response(superjson.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const total = Number(result[0]?.totalCount ?? 0);

    const orders = result.map((order) => ({
      id: order.id,
      status: order.status as OrderStatus,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date(),
      items: Array.isArray(order.items) ? order.items.map((item: OrderItemData) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })) : [],
      isGift: order.giftOrderId !== null,
      buyerDisplayName: order.buyerDisplayName,
      collector: {
        name: order.giftOrderId !== null ? order.recipientName : order.buyerDisplayName,
        phone: order.giftOrderId !== null ? order.recipientPhone : null,
      },
    }));

    // CRITICAL SECURITY CHECK: Verify all orders belong to the correct business
    // This is a double-check to ensure no data leakage between businesses
    const businessIdValidation = await db
      .selectFrom("orders")
      .select("id")
      .where("businessId", "=", business.id)
      .where("id", "in", orders.map(o => o.id))
      .execute();

    const validOrderIds = new Set(businessIdValidation.map(o => o.id));
    const invalidOrders = orders.filter(order => !validOrderIds.has(order.id));

    if (invalidOrders.length > 0) {
      console.error('🚨 CRITICAL SECURITY BREACH: Orders found that do not belong to the correct business!', {
        userId: user.id,
        businessId: business.id,
        invalidOrderIds: invalidOrders.map(o => o.id),
        timestamp: new Date().toISOString()
      });
      
      // Return empty result to prevent data leakage
      return new Response(superjson.stringify({ 
        error: "Security validation failed. Access denied." 
      }), { status: 403 });
    }

    const response: OutputType = { orders, total, page, limit };
    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching business orders:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}