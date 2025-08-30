import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType, BusinessAdminView } from "./businesses_GET.schema";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";
import { sql } from "kysely";
import { Selectable } from "kysely";
import { Businesses } from "../../helpers/schema";

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
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search"),
      status: url.searchParams.get("status"),
    };

    const {
      page,
      limit,
      search,
      status,
    } = schema.parse(queryParams);

    const offset = (page - 1) * limit;

    let query = db
      .selectFrom("businesses")
      .innerJoin("users", "businesses.ownerId", "users.id")
      .select([
        "businesses.id",
        "businesses.businessName",
        "businesses.address",
        "businesses.status",
        "businesses.createdAt",
        "users.displayName as ownerName",
        "users.email as ownerEmail",
      ]);

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb(sql`LOWER(businesses.business_name)`, "like", searchTerm),
          eb(sql`LOWER(users.display_name)`, "like", searchTerm),
        ])
      );
    }

    if (status) {
      query = query.where("businesses.status", "=", status);
    }

    const businessesQuery = query
      .orderBy("businesses.createdAt", "desc")
      .limit(limit)
      .offset(offset);

    const countQuery = query.clearSelect().select((eb) => eb.fn.count<string>("businesses.id").distinct().as("count"));

    const [businesses, totalResult] = await Promise.all([
      businessesQuery.execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);

    const total = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(total / limit);

    const responsePayload: OutputType = {
      businesses: businesses as BusinessAdminView[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
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
    console.error("Failed to fetch businesses:", error);
    if (error instanceof Error) {
        return new Response(
            superjson.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
    return new Response(
      superjson.stringify({ error: "Failed to fetch businesses" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}