import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./users_GET.schema";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";
import { sql } from "kysely";
import { Selectable } from "kysely";
import { Users } from "../../helpers/schema";

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
      role: url.searchParams.get("role"),
    };

    const {
      page,
      limit,
      search,
      role,
    } = schema.parse(queryParams);

    const offset = (page - 1) * limit;

    let query = db.selectFrom("users");

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb(sql`LOWER(display_name)`, "like", searchTerm),
          eb(sql`LOWER(email)`, "like", searchTerm),
        ])
      );
    }

    if (role) {
      query = query.where("role", "=", role);
    }

    const usersQuery = query
      .selectAll()
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset);

    const countQuery = query.select((eb) => eb.fn.countAll<string>().as("count"));

    const [users, totalResult] = await Promise.all([
      usersQuery.execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);

    const total = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(total / limit);

    const responsePayload: OutputType = {
      users: users.map((u: Selectable<Users>) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        avatarUrl: u.avatarUrl,
      })),
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
    console.error("Failed to fetch users:", error);
    return new Response(
      superjson.stringify({ error: "Failed to fetch users" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}