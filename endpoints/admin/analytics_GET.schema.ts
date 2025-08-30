import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type InputType = z.infer<typeof schema>;

export type TopProduct = {
  productId: number;
  productName: string;
  salesCount: number;
};

export type OutputType = {
  totalActiveUsers: number;
  totalActiveBusinesses: number;
  totalPendingBusinesses: number;
  totalSalesVolume: number;
  topProducts: TopProduct[];
} | {
  error: string;
};

export const getAdminAnalytics = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();

  if (validatedParams.startDate) {
    searchParams.append("startDate", validatedParams.startDate.toISOString());
  }
  if (validatedParams.endDate) {
    searchParams.append("endDate", validatedParams.endDate.toISOString());
  }

  const result = await fetch(`/_api/admin/analytics?${searchParams.toString()}`, {
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