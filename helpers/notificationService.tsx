import { db } from './db';
import { Transaction } from 'kysely';
import { DB, NotificationType, RecipientType } from './schema';

export interface CreateNotificationParams {
  recipientId: number;
  recipientType: RecipientType;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Creates a notification within a database transaction.
 * This should be called from other backend services (e.g., after an order is created).
 *
 * @param trx The Kysely transaction object.
 * @param params The notification details.
 */
export async function createNotification(
  trx: Transaction<DB>,
  params: CreateNotificationParams
): Promise<void> {
  const { recipientId, recipientType, type, title, message, data } = params;

  try {
    await trx
      .insertInto('notifications')
      .values({
        recipientId,
        recipientType,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        sentAt: new Date(),
      })
      .execute();
    console.log(`Notification created for ${recipientType} ${recipientId}: ${title}`);
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Re-throw the error to allow the transaction to be rolled back
    throw error;
  }
}

/**
 * Example of how to use this service.
 * This would typically be called from another endpoint like order creation.
 */
/*
async function exampleUsage(orderId: number, buyerId: number, businessId: number) {
  await db.transaction().execute(async (trx) => {
    // ... other order creation logic ...

    // Notify business owner of new order
    await createNotification(trx, {
      recipientId: businessId,
      recipientType: 'business',
      type: 'new_order',
      title: 'New Order Received!',
      message: `You have a new order #${orderId}.`,
      data: { orderId }
    });

    // Notify user that their order is placed
    await createNotification(trx, {
      recipientId: buyerId,
      recipientType: 'user',
      type: 'order_status_change',
      title: 'Order Placed',
      message: `Your order #${orderId} has been successfully placed.`,
      data: { orderId, status: 'pending' }
    });
  });
}
*/