import { z } from "zod";
import superjson from "superjson";

// No input schema needed for this GET request
export const schema = z.object({});

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
  init?: RequestInit
): Promise<OutputType> => {
  const response = await fetch(`/_api/business/products`, {
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