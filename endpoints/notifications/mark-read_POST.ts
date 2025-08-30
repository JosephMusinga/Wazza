import { z } from "zod";
import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { schema, OutputType } from './mark-read_POST.schema';
import superjson from 'superjson';


export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { notificationIds, markAllAsRead } = schema.parse(json);

    const recipientType = user.role === 'business' ? 'business' : 'user';
    let recipientId = user.id;

    if (recipientType === 'business') {
        const business = await db.selectFrom('businesses').select('id').where('ownerId', '=', user.id).executeTakeFirst();
        if (!business) {
            return new Response(superjson.stringify({ error: "Business not found for user." }), { status: 403 });
        }
        recipientId = business.id;
    }

    let query = db
      .updateTable('notifications')
      .set({ readAt: new Date() })
      .where('recipientId', '=', recipientId)
      .where('recipientType', '=', recipientType)
      .where('readAt', 'is', null);

    if (markAllAsRead) {
      // No additional where clause needed, it will mark all unread for the user.
    } else if (notificationIds && notificationIds.length > 0) {
      query = query.where('id', 'in', notificationIds);
    } else {
      return new Response(superjson.stringify({ error: 'Either notificationIds or markAllAsRead must be provided.' }), { status: 400 });
    }

    const result = await query.executeTakeFirst();

    const response: OutputType = {
      success: true,
      updatedCount: Number(result.numUpdatedRows),
    };

    return new Response(superjson.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: 'Invalid request body', details: error.issues }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}