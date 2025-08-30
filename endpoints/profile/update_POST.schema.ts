import { z } from "zod";
import superjson from "superjson";
import { User } from "../../helpers/User";

export const schema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty.").optional(),
  email: z.string().email("Invalid email address.").optional(),
  address: z.string().min(1, "Address cannot be empty.").optional(),
  phone: z.string().min(1, "Phone number cannot be empty.").optional(),
  nationalId: z.string().min(1, "National ID cannot be empty.").optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = User;

export const postProfileUpdate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/profile/update`, {
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
    const errorObject = superjson.parse(text);
    const errorMessage = 
      typeof errorObject === 'object' && 
      errorObject !== null && 
      'error' in errorObject && 
      typeof errorObject.error === 'string' 
        ? errorObject.error 
        : "Failed to update profile";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(text);
};