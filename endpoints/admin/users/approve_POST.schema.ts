import { z } from "zod";

export const schema = z.object({
  userId: z.number(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { message: string };

export async function postApproveUser(data: InputType): Promise<OutputType> {
  const result = await fetch("/_api/admin/users/approve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Failed to approve user");
  }

  return result.json();
}



