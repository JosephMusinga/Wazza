import { z } from "zod";
import superjson from "superjson";
import { OrderStatusArrayValues } from "../../../helpers/schema";
import { Selectable } from "kysely";
import { Orders } from "../../../helpers/schema";

export const schema = z.object({
  orderId: z.number().int().positive(),
  status: z.enum(OrderStatusArrayValues),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: true;
  message: string;
  order: Selectable<Orders>;
};

export const postBusinessOrderStatus = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/business/orders/status`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorObject = superjson.parse(await response.text());
    const errorMessage = (errorObject && typeof errorObject === 'object' && 'error' in errorObject && typeof errorObject.error === 'string') 
      ? errorObject.error 
      : "Failed to update order status";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(await response.text());
};