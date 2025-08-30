import { z } from "zod";
import superjson from "superjson";
import { OrderStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(OrderStatusArrayValues).optional(),
  sortBy: z.enum(["createdAt", "totalAmount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  isGift: z.coerce.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

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

const CollectorSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
});

const OrderSchema = z.object({
  id: z.number(),
  status: z.enum(OrderStatusArrayValues),
  totalAmount: z.number(),
  currency: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  items: z.array(OrderItemSchema),
  isGift: z.boolean(),
  collector: CollectorSchema,
});

export type Order = z.infer<typeof OrderSchema>;

export type OutputType = {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
};

export const getBusinessOrders = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();
  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/_api/business/orders?${searchParams.toString()}`, {
    method: "GET",
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
      : "Failed to fetch business orders";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(await response.text());
};