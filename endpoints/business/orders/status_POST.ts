import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./status_POST.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Orders } from "../../../helpers/schema";
import { createNotification } from "../../../helpers/notificationService";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "business") {
      return new Response(
        superjson.stringify({ error: "Forbidden: User is not a business owner." }),
        { status: 403 }
      );
    }

    const business = await db
      .selectFrom("businesses")
      .select("id")
      .where("ownerId", "=", user.id)
      .executeTakeFirst();

    if (!business) {
      return new Response(
        superjson.stringify({ error: "Forbidden: No business associated with this user." }),
        { status: 403 }
      );
    }

    // Get request body text
    const requestText = await request.text();
    
    // Handle empty request body
    if (!requestText.trim()) {
      return new Response(
        superjson.stringify({ error: "Request body is required." }),
        { status: 400 }
      );
    }

    let json;
    try {
      // Try parsing as superjson first
      json = superjson.parse(requestText);
      
      // If superjson.parse returns undefined, try regular JSON
      if (json === undefined) {
        json = JSON.parse(requestText);
      }
    } catch (superJsonError) {
      // Fallback to regular JSON parsing
      try {
        json = JSON.parse(requestText);
      } catch (jsonError) {
        return new Response(
          superjson.stringify({ error: "Invalid request body format. Expected JSON." }),
          { status: 400 }
        );
      }
    }

    // Validate parsed data
    let parsedData;
    try {
      parsedData = schema.parse(json);
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : "Invalid request data.";
      return new Response(
        superjson.stringify({ error: errorMessage }),
        { status: 400 }
      );
    }

    const { orderId, status } = parsedData;

    const order = await db
      .selectFrom("orders")
      .selectAll()
      .where("id", "=", orderId)
      .where("businessId", "=", business.id)
      .executeTakeFirst();

    if (!order) {
      return new Response(
        superjson.stringify({ error: "Order not found or you do not have permission to update it." }),
        { status: 404 }
      );
    }

    // Optional: Add status transition validation logic here if needed
    // e.g., if (order.status === 'completed' && status !== 'refunded') { ... }

    const updateResult = await db.transaction().execute(async (trx) => {
      const updatedOrder = await trx
        .updateTable("orders")
        .set({
          status: status,
          updatedAt: new Date(),
          ...(status === "completed" && { completedAt: new Date() }),
        })
        .where("id", "=", orderId)
        .returningAll()
        .executeTakeFirst();

      if (!updatedOrder) {
        throw new Error("Failed to update order status.");
      }

      // Create notification for the customer about order status change
      await createNotification(trx, {
        recipientId: updatedOrder.buyerId,
        recipientType: 'user',
        type: 'order_status_change',
        title: 'Order Status Updated',
        message: `Your order #${orderId} status has been updated to ${status}.`,
        data: { orderId, status, businessId: business.id }
      });

      return updatedOrder;
    });

    const updatedOrder: Selectable<Orders> = updateResult;

    const response: OutputType = {
      success: true,
      message: `Order status successfully updated to ${status}.`,
      order: updatedOrder,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}