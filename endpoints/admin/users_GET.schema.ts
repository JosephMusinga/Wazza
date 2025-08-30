import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues } from "../../helpers/schema";
import { User } from "../../helpers/User";

export const schema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().nullable().optional().transform(val => val || undefined),
  role: z.enum(UserRoleArrayValues).nullable().optional().transform(val => val || undefined),
});

export type InputType = z.infer<typeof schema>;

export type UserAdminView = Pick<User, 'id' | 'displayName' | 'email' | 'role' | 'status' | 'avatarUrl'> & {
  createdAt: Date | null;
};

export type OutputType = {
  users: UserAdminView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} | {
  error: string;
};

export const getAdminUsers = async (
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

  const result = await fetch(`/_api/admin/users?${searchParams.toString()}`, {
    method: "GET",
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