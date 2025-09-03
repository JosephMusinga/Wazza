import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./reject_POST.schema";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Businesses, BusinessStatus } from "../../../helpers/schema";
import { createNotification } from "../../../helpers/notificationService";

async function updateBusinessStatus(
  businessId: number,
  status: BusinessStatus
): Promise<Selectable<Businesses>> {
  // Get business details before updating for notification
  const businessToUpdate = await db
    .selectFrom("businesses")
    .innerJoin("users", "users.id", "businesses.ownerId")
    .select(["businesses.id", "businesses.businessName", "users.email as ownerEmail"])
    .where("businesses.id", "=", businessId)
    .where("businesses.status", "=", "pending")
    .executeTakeFirst();

  if (!businessToUpdate) {
    const currentBusiness = await db.selectFrom("businesses").where("id", "=", businessId).selectAll().executeTakeFirst();
    if (!currentBusiness) {
        throw new Error("Business not found.");
    }
    if (currentBusiness.status !== 'pending') {
        throw new Error(`Cannot reject a business with status: ${currentBusiness.status}.`);
    }
    throw new Error("Failed to reject business.");
  }

  const updatedBusiness = await db
    .updateTable("businesses")
    .set({ status, updatedAt: new Date() })
    .where("id", "=", businessId)
    .where("status", "=", "pending")
    .returningAll()
    .executeTakeFirst();

  if (!updatedBusiness) {
    throw new Error("Failed to reject business.");
  }

        // Create notification for business owner about rejection
      await createNotification(db, {
        recipientId: updatedBusiness.ownerId,
        recipientType: 'user',
        type: 'business_rejected',
        title: 'Business Application Rejected',
        message: `Your business application "${businessToUpdate.businessName}" has been rejected. You cannot log in with this account. Please contact support for more information.`,
        data: { businessId: businessToUpdate.id, businessName: businessToUpdate.businessName }
      });

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

    const business = await updateBusinessStatus(businessId, "rejected");

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
    console.error("Failed to reject business:", error);
    return new Response(
      superjson.stringify({ error: errorMessage }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}