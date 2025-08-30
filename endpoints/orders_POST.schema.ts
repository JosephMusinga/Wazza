import { z } from "zod";
import superjson from "superjson";
import { OrderStatusArrayValues } from '../helpers/schema';

const OrderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive()
});

export const schema = z.object({
  businessId: z.number().int().positive(),
  items: z.array(OrderItemSchema).min(1),
  shippingAddress: z.string()
});

export type InputType = z.infer<typeof schema>;

const ResponseProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl: z.string().nullable()
});

const ResponseOrderItemSchema = z.object({
  id: z.number(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  product: ResponseProductSchema
});

const OrderSchema = z.object({
  id: z.number(),
  businessId: z.number(),
  buyerId: z.number(),
  status: z.enum(OrderStatusArrayValues),
  totalAmount: z.number(),
  currency: z.string(),
  shippingAddress: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  redemptionCode: z.string().nullable(),
  items: z.array(ResponseOrderItemSchema)
});

export type OutputType = z.infer<typeof OrderSchema>;

export const postOrders = async (
body: InputType,
init?: RequestInit)
: Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/orders`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const text = await response.text();
  if (!response.ok) {
    let errorObject;
    try {
      errorObject = superjson.parse(text);
    } catch (e) {
      throw new Error(`An unknown error occurred: ${response.statusText}`);
    }
    const errorMessage =
    typeof errorObject === "object" &&
    errorObject !== null &&
    "error" in errorObject &&
    typeof errorObject.error === "string" ?
    errorObject.error :
    "Failed to create order";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(text);
};