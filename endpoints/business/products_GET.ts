import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { OutputType } from "./products_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from '../../helpers/getSetServerSession';
import { Selectable } from 'kysely';
import { Products } from '../../helpers/schema';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== 'business') {
      return new Response(
        superjson.stringify({ error: "Forbidden: Only business owners can access this resource." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // First, find the business owned by this user
    const business = await db
      .selectFrom("businesses")
      .select("id")
      .where("ownerId", "=", user.id)
      .where("status", "=", "active")
      .executeTakeFirst();

    if (!business) {
      return new Response(
        superjson.stringify({ error: "No active business found for this user." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Now query products using the correct businessId
    const products: Selectable<Products>[] = await db
      .selectFrom("products")
      .selectAll()
      .where("businessId", "=", business.id)
      .orderBy('createdAt', 'desc')
      .execute();

    const responseData = products.map(p => ({
        ...p,
        price: Number(p.price)
    }));

    return new Response(
      superjson.stringify(responseData satisfies OutputType),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching business products:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      superjson.stringify({ error: "Failed to fetch business products." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}