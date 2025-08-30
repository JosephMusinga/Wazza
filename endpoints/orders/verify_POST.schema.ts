import { z } from "zod";
import superjson from "superjson";
import { OrderStatus } from "../../helpers/schema";

export const schema = z.object({
  orderId: z.number().int().positive("Order ID must be a positive number"),
  redemptionCode: z.string().min(1, "Redemption code is required"),
});

export type InputType = z.infer<typeof schema>;

export type RecipientInfo = {
  recipientName: string;
  recipientPhone: string;
  recipientNationalId: string;
};

export type BuyerInfo = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerNationalId: string;
};

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl: z.string().nullable(),
});

const OrderItemSchema = z.object({
  id: z.number(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  product: ProductSchema,
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export type OutputType = {
  id: number;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  isGift: boolean;
  recipientInfo?: RecipientInfo;
  buyerInfo?: BuyerInfo;
  items: OrderItem[];
};

export const postOrdersVerify = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/orders/verify`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await response.text();
  if (!response.ok) {
    let errorMessage = "Failed to verify order.";
    try {
      const errorObject = superjson.parse(responseText);
      let actualError = errorObject;
      if (errorObject && typeof errorObject === 'object' && 'json' in errorObject) {
        actualError = errorObject.json;
      }
      if (actualError && typeof actualError === 'object' && 'error' in actualError && typeof actualError.error === 'string') {
        errorMessage = actualError.error;
      }
    } catch (e) {
        // Fallback if superjson parsing fails
        console.error("Failed to parse error response:", e);
    }
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(responseText);
};