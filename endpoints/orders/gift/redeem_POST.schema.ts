import { z } from "zod";
import superjson from "superjson";
import { OrderStatus, OrderStatusArrayValues } from "../../../helpers/schema";

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
  recipientInfo: RecipientInfo;
  isGift: true;
  items: OrderItem[];
};

export const postOrdersGiftRedeem = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/orders/gift/redeem`, {
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
    let errorMessage = "Failed to redeem gift code.";
    
    // First try superjson parsing
    try {
      const errorObject = superjson.parse(responseText);
      
      // Handle superjson wrapped response (e.g., {"json":{"error":"message"}})
      let actualError = errorObject;
      if (errorObject && typeof errorObject === 'object' && 'json' in errorObject) {
        actualError = errorObject.json;
      }
      
      if (actualError && typeof actualError === 'object' && 'error' in actualError && typeof actualError.error === 'string') {
        errorMessage = actualError.error;
      }
    } catch (parseError) {
      // If superjson parsing fails, try regular JSON parsing
      try {
        const regularJsonError = JSON.parse(responseText);
        
        if (regularJsonError && typeof regularJsonError === 'object' && 'error' in regularJsonError && typeof regularJsonError.error === 'string') {
          errorMessage = regularJsonError.error;
        }
      } catch (jsonError) {
        // If all parsing attempts fail, use fallback message
        errorMessage = "An unknown error occurred during gift redemption.";
      }
    }
    
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(responseText);
};