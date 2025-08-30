import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  businessId: z.string().refine(val => !isNaN(parseInt(val, 10)), {
    message: "Business ID must be a number.",
  }),
});

export type InputType = z.infer<typeof schema>;

export type Product = {
  id: number;
  businessId: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type OutputType = Product[];

export const getBusinessProducts = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const params = new URLSearchParams({
    businessId: validatedInput.businessId,
  });

  const response = await fetch(`/_api/businesses/products?${params.toString()}`, {
    method: "GET",
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
      typeof errorObject === 'object' &&
      errorObject !== null &&
      'error' in errorObject &&
      typeof errorObject.error === 'string'
        ? errorObject.error
        : "Failed to fetch business products";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(text);
};