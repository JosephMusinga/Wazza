import { z } from "zod";
import { User } from '../helpers/User';
import superjson from "superjson";

// No input schema needed for a GET request fetching the current user's profile
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType =
{
  user: User;
} |
{
  error: string;
};

export const getProfile = async (
init?: RequestInit)
: Promise<OutputType> => {
  const result = await fetch(`/_api/profile`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!result.ok) {
    try {
      const errorObject = superjson.parse(await result.text());
      if (errorObject && typeof errorObject === 'object' && 'error' in errorObject) {
        throw new Error(errorObject.error as string);
      }
      throw new Error(`Request failed with status ${result.status}`);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(`Request failed with status ${result.status}`);
    }
  }

  return superjson.parse<OutputType>(await result.text());
};