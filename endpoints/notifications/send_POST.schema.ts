import { z } from 'zod';
import superjson from 'superjson';
import { NotificationTypeArrayValues, RecipientTypeArrayValues } from '../../helpers/schema';

type ErrorResponse = { error?: string };

export const schema = z.object({
  recipientId: z.number().int().positive(),
  recipientType: z.enum(RecipientTypeArrayValues),
  type: z.enum(NotificationTypeArrayValues),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
};

export const postNotificationsSend = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch('/_api/notifications/send', {
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
    throw new Error(errorObject.error || 'Failed to send notification');
  }

  return superjson.parse<OutputType>(text);
};