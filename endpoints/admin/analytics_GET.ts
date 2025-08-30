import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType, TopProduct } from "./analytics_GET.schema";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const queryParams = {
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate"),
    };

    const { startDate, endDate } = schema.parse(queryParams);

    const applyDateFilter = <T extends 'users' | 'businesses' | 'orders'>(
      query: any,
      table: T,
      column: keyof import('../../helpers/schema').DB[T] = 'createdAt'
    ) => {
      let q = query;
      if (startDate) {
        q = q.where(`${table}.${column as string}`, ">=", startDate);
      }
      if (endDate) {
        q = q.where(`${table}.${column as string}`, "<=", endDate);
      }
      return q;
    };

    // Metric: Total Active Users
    const totalActiveUsersQuery = db
      .selectFrom("users")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("status", "=", "active");
    
    // Metric: Total Active Businesses
    let totalActiveBusinessesQuery = db
      .selectFrom("businesses")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("status", "=", "active");
    totalActiveBusinessesQuery = applyDateFilter(totalActiveBusinessesQuery, 'businesses', 'approvedAt');

    // Metric: Total Pending Businesses
    let totalPendingBusinessesQuery = db
      .selectFrom("businesses")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("status", "=", "pending");
    totalPendingBusinessesQuery = applyDateFilter(totalPendingBusinessesQuery, 'businesses');

    // Metric: Total Sales Volume
    let totalSalesVolumeQuery = db
      .selectFrom("orders")
      .select((eb) => eb.fn.sum<string>("totalAmount").as("total"))
      .where('status', 'in', ['completed', 'processing']);
    totalSalesVolumeQuery = applyDateFilter(totalSalesVolumeQuery, 'orders', 'completedAt');

    // Metric: Top 5 Popular Products
    let topProductsQuery = db
      .selectFrom("orderItems")
      .innerJoin("products", "orderItems.productId", "products.id")
      .innerJoin("orders", "orderItems.orderId", "orders.id")
      .select([
        "products.id as productId",
        "products.name as productName",
        (eb) => eb.fn.sum<number>("orderItems.quantity").as("salesCount"),
      ])
      .groupBy(["products.id", "products.name"])
      .orderBy("salesCount", "desc")
      .limit(5);
    topProductsQuery = applyDateFilter(topProductsQuery, 'orders', 'completedAt');


    const [
      activeUsersResult,
      activeBusinessesResult,
      pendingBusinessesResult,
      salesVolumeResult,
      topProductsResult,
    ] = await Promise.all([
      totalActiveUsersQuery.executeTakeFirstOrThrow(),
      totalActiveBusinessesQuery.executeTakeFirstOrThrow(),
      totalPendingBusinessesQuery.executeTakeFirstOrThrow(),
      totalSalesVolumeQuery.executeTakeFirstOrThrow(),
      topProductsQuery.execute(),
    ]);

    const responsePayload: OutputType = {
      totalActiveUsers: parseInt(activeUsersResult.count, 10),
      totalActiveBusinesses: parseInt(activeBusinessesResult.count, 10),
      totalPendingBusinesses: parseInt(pendingBusinessesResult.count, 10),
      totalSalesVolume: parseFloat(salesVolumeResult.total || "0"),
      topProducts: topProductsResult.map(p => ({...p, salesCount: Number(p.salesCount)})) as TopProduct[],
    };

    return new Response(superjson.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Failed to fetch admin analytics:", error);
    if (error instanceof Error) {
        return new Response(
            superjson.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
    return new Response(
      superjson.stringify({ error: "Failed to fetch admin analytics" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}