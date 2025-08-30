import { z } from 'zod';
import superjson from 'superjson';
import { NotificationTypeArrayValues } from '../helpers/schema';

type ErrorResponse = { error?: string };

export const schema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  filter: z.enum(['all', 'read', 'unread']).optional().default('all'),
});

export type GetNotificationsInputType = z.infer<typeof schema>;

export const NotificationSchema = z.object({
  id: z.number(),
  type: z.enum(NotificationTypeArrayValues),
  title: z.string(),
  message: z.string(),
  readAt: z.date().nullable(),
  sentAt: z.date(),
  data: z.record(z.any()).nullable(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export type OutputType = {
  notifications: Notification[];
  page: number;
  totalPages: number;
  total: number;
};

export const getNotifications = async (
  params: GetNotificationsInputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(validatedParams.page));
  searchParams.set('limit', String(validatedParams.limit));
  searchParams.set('filter', validatedParams.filter);

  const response = await fetch(`/_api/notifications?${searchParams.toString()}`, {
    method: 'GET',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    const errorObject = superjson.parse<ErrorResponse>(text);
    throw new Error(errorObject.error || 'Failed to fetch notifications');
  }

  return superjson.parse<OutputType>(text);
};