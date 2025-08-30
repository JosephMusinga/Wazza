import { db } from '../../../helpers/db';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import { OutputType, schema } from "./delete_POST.schema";
import superjson from "superjson";
import { z } from "zod";
import { NotAuthenticatedError } from '../../../helpers/getSetServerSession';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== 'business') {
      return new Response(
        superjson.stringify({ error: "Forbidden: Only business owners can delete products." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const { productId } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
        // First, find the business owned by this user
        const business = await trx
            .selectFrom("businesses")
            .select("id")
            .where("ownerId", "=", user.id)
            .where("status", "=", "active")
            .executeTakeFirst();

        if (!business) {
            return { status: 'NO_BUSINESS' };
        }

        const product = await trx
            .selectFrom('products')
            .select('businessId')
            .where('id', '=', productId)
            .executeTakeFirst();

        if (!product) {
            return { status: 'NOT_FOUND' };
        }

        if (product.businessId !== business.id) {
            return { status: 'FORBIDDEN' };
        }

        const deleteResult = await trx
            .deleteFrom('products')
            .where('id', '=', productId)
            .executeTakeFirst();
        
        return { status: 'SUCCESS', numDeletedRows: deleteResult.numDeletedRows };
    });

    if (result.status === 'NO_BUSINESS') {
        return new Response(
            superjson.stringify({ error: "No active business found for this user." }),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }

    if (result.status === 'NOT_FOUND') {
        return new Response(superjson.stringify({ error: "Product not found." }), { status: 404 });
    }

    if (result.status === 'FORBIDDEN') {
        return new Response(superjson.stringify({ error: "Forbidden: You do not own this product." }), { status: 403 });
    }

    if (result.numDeletedRows === 0n) {
        // This case should ideally not be reached due to the checks above, but it's good practice.
        return new Response(superjson.stringify({ error: "Product not found or could not be deleted." }), { status: 404 });
    }

    return new Response(
      superjson.stringify({ success: true, message: "Product deleted successfully." } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error deleting product:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input", details: error.issues }), { status: 400 });
    }
    return new Response(superjson.stringify({ error: "Failed to delete product." }), { status: 500 });
  }
}