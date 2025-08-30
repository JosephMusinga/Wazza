import { db } from '../../../helpers/db';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import { OutputType, schema } from "./update_POST.schema";
import superjson from "superjson";
import { z } from "zod";
import { NotAuthenticatedError } from '../../../helpers/getSetServerSession';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== 'business') {
      return new Response(
        superjson.stringify({ error: "Forbidden: Only business owners can update products." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const { productId, ...updateData } = schema.parse(json);

    if (Object.keys(updateData).length === 0) {
        return new Response(
            superjson.stringify({ error: "No update data provided." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const updatedProduct = await db.transaction().execute(async (trx) => {
        // First, find the business owned by this user
        const business = await trx
            .selectFrom("businesses")
            .select("id")
            .where("ownerId", "=", user.id)
            .where("status", "=", "active")
            .executeTakeFirst();

        if (!business) {
            throw new Error("NO_BUSINESS");
        }

        const product = await trx
            .selectFrom('products')
            .select('businessId')
            .where('id', '=', productId)
            .executeTakeFirst();

        if (!product) {
            return null; // Will be handled outside transaction
        }

        if (product.businessId !== business.id) {
            throw new Error("FORBIDDEN");
        }

        // Build database update object with proper type conversions
        const dbUpdateFields: any = { updatedAt: new Date() };
        
        if (updateData.name !== undefined) {
            dbUpdateFields.name = updateData.name;
        }
        if (updateData.description !== undefined) {
            dbUpdateFields.description = updateData.description;
        }
        if (updateData.price !== undefined) {
            dbUpdateFields.price = updateData.price.toString(); // Convert number to string for database
        }
        if (updateData.imageUrl !== undefined) {
            dbUpdateFields.imageUrl = updateData.imageUrl;
        }
        if (updateData.category !== undefined) {
            dbUpdateFields.category = updateData.category;
        }
        
        return await trx
            .updateTable('products')
            .set(dbUpdateFields)
            .where('id', '=', productId)
            .returningAll()
            .executeTakeFirstOrThrow();
    });

    if (!updatedProduct) {
        return new Response(
            superjson.stringify({ error: "Product not found." }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }
    
    const responseData = {
        ...updatedProduct,
        price: Number(updatedProduct.price)
    };

    return new Response(
      superjson.stringify(responseData satisfies OutputType),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input", details: error.issues }), { status: 400 });
    }
    if (error instanceof Error && error.message === "NO_BUSINESS") {
        return new Response(
            superjson.stringify({ error: "No active business found for this user." }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
        return new Response(superjson.stringify({ error: "Forbidden: You do not own this product." }), { status: 403 });
    }
    return new Response(superjson.stringify({ error: "Failed to update product." }), { status: 500 });
  }
}