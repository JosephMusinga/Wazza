import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, InputType, OutputType } from "./approve_POST.schema";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Businesses } from "../../../helpers/schema";
import { createNotification } from "../../../helpers/notificationService";

async function updateBusinessStatus(
  businessId: number,
  adminUserId: number
): Promise<Selectable<Businesses>> {
  const now = new Date();
  
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
        throw new Error(`Cannot approve a business with status: ${currentBusiness.status}.`);
    }
    throw new Error("Failed to approve business.");
  }

  const updatedBusiness = await db
    .updateTable("businesses")
    .set({
      status: "active",
      approvedAt: now,
      approvedBy: adminUserId,
      updatedAt: now,
    })
    .where("id", "=", businessId)
    .where("status", "=", "pending")
    .returningAll()
    .executeTakeFirst();

  if (!updatedBusiness) {
    throw new Error("Failed to approve business.");
  }

  // Create notification for business owner about approval
  await createNotification(db, {
    recipientId: updatedBusiness.ownerId,
    recipientType: 'user',
    type: 'business_approved',
    title: 'Business Approved!',
    message: `Congratulations! Your business "${businessToUpdate.businessName}" has been approved and is now active on the platform.`,
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

    const business = await updateBusinessStatus(businessId, user.id);

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
    console.error("Failed to approve business:", error);
    return new Response(
      superjson.stringify({ error: errorMessage }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}