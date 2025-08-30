import { z } from "zod";
import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../helpers/getSetServerSession';
import { OutputType, schema } from "./products_GET.schema";
import superjson from "superjson";
import { Selectable } from 'kysely';
import { Products } from '../../helpers/schema';

export async function handle(request: Request) {
  try {
    // Ensure user is authenticated
    await getServerUserSession(request);
    
    const url = new URL(request.url);
    const parsedInput = schema.parse({
      businessId: url.searchParams.get('businessId'),
    });
    const businessId = Number(parsedInput.businessId);

    // Validate business exists, is active, and owner has business role
    const business = await db
      .selectFrom("businesses")
      .leftJoin("users", "users.id", "businesses.ownerId")
      .selectAll("businesses")
      .where("businesses.id", "=", businessId)
      .where("businesses.status", "=", "active")
      .where("users.role", "=", "business")
      .executeTakeFirst();

    if (!business) {
      return new Response(
        superjson.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Query real products from the database
    const products: Selectable<Products>[] = await db
      .selectFrom("products")
      .selectAll()
      .where("businessId", "=", businessId)
      .orderBy('createdAt', 'desc')
      .execute();

    // Convert price to number for response
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
    if (error instanceof z.ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid request parameters", details: error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      superjson.stringify({ error: "Failed to fetch business products." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}