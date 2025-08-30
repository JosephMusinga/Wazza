import { z } from "zod";
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema, OutputType, Notification } from './notifications_GET.schema';
import superjson from 'superjson';

import { Selectable } from 'kysely';
import { Notifications } from '../helpers/schema';

function mapDbNotificationToOutput(dbNotification: Selectable<Notifications>): Notification {
  return {
    id: dbNotification.id,
    type: dbNotification.type,
    title: dbNotification.title,
    message: dbNotification.message,
    readAt: dbNotification.readAt,
    sentAt: dbNotification.sentAt || dbNotification.createdAt || new Date(),
    data: dbNotification.data as Record<string, any> | null,
  };
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 10,
      filter: url.searchParams.get('filter') || 'all',
    };

    const { page, limit, filter } = schema.parse(queryParams);

    const recipientType = user.role === 'business' ? 'business' : 'user';
    let recipientId = user.id;

    if (recipientType === 'business') {
        const business = await db.selectFrom('businesses').select('id').where('ownerId', '=', user.id).executeTakeFirst();
        if (!business) {
             return new Response(superjson.stringify({ notifications: [], page: 1, totalPages: 0, total: 0 } satisfies OutputType), { status: 200 });
        }
        recipientId = business.id;
    }

    let query = db
      .selectFrom('notifications')
      .where('recipientId', '=', recipientId)
      .where('recipientType', '=', recipientType);

    if (filter === 'read') {
      query = query.where('readAt', 'is not', null);
    } else if (filter === 'unread') {
      query = query.where('readAt', 'is', null);
    }

    const totalResult = await query.select(db.fn.count('id').as('count')).executeTakeFirstOrThrow();
    const total = Number(totalResult.count);
    const totalPages = Math.ceil(total / limit);

    const notifications = await query
      .selectAll()
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    const response: OutputType = {
      notifications: notifications.map(mapDbNotificationToOutput),
      page,
      totalPages,
      total,
    };

    return new Response(superjson.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: 'Invalid query parameters', details: error.issues }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}