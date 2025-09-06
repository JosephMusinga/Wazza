import { db } from "../../../helpers/db";
import { schema } from "./approve_POST.schema";
import { createNotification } from "../../../helpers/notificationService";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { userId } = schema.parse(json);

    // Update user status to active
    const updatedUser = await db
      .updateTable("users")
      .set({ status: "active" })
      .where("id", "=", userId)
      .returning(["id", "email", "displayName", "role"])
      .executeTakeFirst();

    if (!updatedUser) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Create notification for the user
    await createNotification({
      userId: updatedUser.id,
      type: "account_approved",
      title: "Account Approved",
      message: `Your ${updatedUser.role === "business" ? "Agent Seller" : "Agent Buyer"} account has been approved! You can now log in and access your dashboard.`,
    });

    return Response.json({
      message: `User ${updatedUser.displayName} has been approved successfully`,
    });
  } catch (error) {
    console.error("Error approving user:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
