import { z } from "zod";
import superjson from "superjson";
import { User } from "../../../helpers/User";

export const schema = z.object({
  userId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
} | {
  error: string;
};

export const postReactivateUser = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/users/reactivate`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    try {
      const errorObject = superjson.parse(text);
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

  return superjson.parse<OutputType>(text);
};