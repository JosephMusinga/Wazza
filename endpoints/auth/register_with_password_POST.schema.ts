import { z } from "zod";
import { User } from "../../helpers/User";
import { UserRoleArrayValues } from "../../helpers/schema";

export const schema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required").regex(/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"),
  nationalId: z.string().min(1, "National ID is required").min(5, "National ID must be at least 5 characters"),
  role: z.enum(UserRoleArrayValues, {
    errorMap: () => ({ message: "Role must be one of: user, business, admin" }),
  }),
});

export type OutputType = {
  user: User;
};

export const postRegister = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/register_with_password`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include", // Important for cookies to be sent and received
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Registration failed");
  }

  return result.json();
};
