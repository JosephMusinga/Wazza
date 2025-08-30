import { z } from "zod";
import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { schema, OutputType } from './send_POST.schema';
import superjson from 'superjson';

import { createNotification } from '../../helpers/notificationService';

export async function handle(request: Request) {
  try {
    // This is an internal endpoint, should be protected (e.g., admin only)
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin') {
      return new Response(superjson.stringify({ error: 'Forbidden: Admins only.' }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const notificationData = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      await createNotification(trx, notificationData);
    });

    const response: OutputType = {
      success: true,
      message: 'Notification sent successfully.',
    };

    return new Response(superjson.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: 'Invalid request body', details: error.issues }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}