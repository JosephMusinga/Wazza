import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./suspend_POST.schema";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Businesses, BusinessStatus } from "../../../helpers/schema";

async function updateBusinessStatus(
  businessId: number,
  status: BusinessStatus
): Promise<Selectable<Businesses>> {
  const updatedBusiness = await db
    .updateTable("businesses")
    .set({ status, updatedAt: new Date() })
    .where("id", "=", businessId)
    .returningAll()
    .executeTakeFirst();

  if (!updatedBusiness) {
    throw new Error("Business not found or failed to update.");
  }

  return updatedBusiness;
}

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const { businessId } = schema.parse(json);

    const business = await updateBusinessStatus(businessId, "suspended");

    return new Response(superjson.stringify({ business } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Failed to suspend business:", error);
    return new Response(
      superjson.stringify({ error: errorMessage }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}