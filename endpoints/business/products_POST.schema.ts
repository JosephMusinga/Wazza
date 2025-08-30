import { z } from "zod";
import superjson from "superjson";
import { Product } from "./products_GET.schema";

export const schema = z.object({
  name: z.string().min(1, "Product name is required."),
  description: z.string().nullable().optional(),
  price: z.number().positive("Price must be a positive number."),
  imageUrl: z.string().url("Invalid image URL.").nullable().optional(),
  category: z.string().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Product;

export const postBusinessProduct = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/business/products`, {
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
      typeof errorObject === 'object' &&
      errorObject !== null &&
      'error' in errorObject &&
      typeof errorObject.error === 'string'
        ? errorObject.error
        : "Failed to create product";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(text);
};