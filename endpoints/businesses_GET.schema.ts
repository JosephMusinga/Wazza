import { z } from "zod";
import superjson from "superjson";

// No input schema for a simple GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type Business = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
};

export type OutputType = Business[];

export const getBusinesses = async (
  init?: RequestInit
): Promise<OutputType> => {
  const response = await fetch(`/_api/businesses`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    const errorObject = superjson.parse(text);
    const errorMessage = 
      typeof errorObject === 'object' && 
      errorObject !== null && 
      'error' in errorObject && 
      typeof errorObject.error === 'string' 
        ? errorObject.error 
        : "Failed to fetch businesses";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(text);
};