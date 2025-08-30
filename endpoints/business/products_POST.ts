import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { OutputType, schema } from "./products_POST.schema";
import superjson from "superjson";
import { z } from "zod";
import { NotAuthenticatedError } from '../../helpers/getSetServerSession';
import { Selectable } from 'kysely';
import { Products } from '../../helpers/schema';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== 'business') {
      return new Response(
        superjson.stringify({ error: "Forbidden: Only business owners can add products." }),
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

    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const newProduct = await db
      .insertInto('products')
      .values({
        businessId: business.id,
        name: validatedInput.name,
        description: validatedInput.description,
        price: validatedInput.price.toString(),
        imageUrl: validatedInput.imageUrl,
        category: validatedInput.category,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const responseData = {
        ...newProduct,
        price: Number(newProduct.price)
    };

    return new Response(
      superjson.stringify(responseData satisfies OutputType),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof z.ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid input", details: error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      superjson.stringify({ error: "Failed to create product." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}