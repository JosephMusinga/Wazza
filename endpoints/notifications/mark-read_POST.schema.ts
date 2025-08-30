import { z } from 'zod';
import superjson from 'superjson';

type ErrorResponse = { error?: string };

export const schema = z.object({
  notificationIds: z.array(z.number().int().positive()).optional(),
  markAllAsRead: z.boolean().optional(),
}).refine(data => data.notificationIds || data.markAllAsRead, {
  message: "Either 'notificationIds' or 'markAllAsRead' must be provided.",
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  updatedCount: number;
};

export const postNotificationsMarkRead = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch('/_api/notifications/mark-read', {
    method: 'POST',
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    const errorObject = superjson.parse<ErrorResponse>(text);
    throw new Error(errorObject.error || 'Failed to mark notifications as read');
  }

  return superjson.parse<OutputType>(text);
};