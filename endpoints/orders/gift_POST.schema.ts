import { z } from "zod";
import superjson from "superjson";
import { OrderStatusArrayValues } from '../../helpers/schema';

const OrderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const schema = z.object({
  businessId: z.number().int().positive(),
  items: z.array(OrderItemSchema).min(1, "A gift order must have at least one item."),
  recipientName: z.string().min(1, "Recipient name is required."),
  recipientPhone: z.string().min(1, "Recipient phone is required."),
  recipientNationalId: z.string().min(1, "Recipient national ID is required.").max(50, "Recipient national ID is too long."),
  regularPersonName: z.string().min(1, "Regular person name is required."),
  regularPersonPhone: z.string().min(1, "Regular person phone is required."),
});

export type InputType = z.infer<typeof schema>;

const ResponseProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl: z.string().nullable(),
});

const ResponseOrderItemSchema = z.object({
  id: z.number(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  product: ResponseProductSchema,
});

const GiftOrderSchema = z.object({
  id: z.number(),
  businessId: z.number(),
  buyerId: z.number(),
  status: z.enum(OrderStatusArrayValues),
  totalAmount: z.number(),
  currency: z.string(),
  shippingAddress: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  redemptionCode: z.string(),
  smsStatus: z.enum(['sent', 'failed']),
  items: z.array(ResponseOrderItemSchema),
});

export type OutputType = z.infer<typeof GiftOrderSchema>;

export const postOrdersGift = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/orders/gift`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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
      typeof errorObject.error === "string"
        ? errorObject.error
        : "Failed to create gift order";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(text);
};