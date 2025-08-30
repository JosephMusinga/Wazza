import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { ZodError } from "zod";

export async function handle(request: Request) {
  if (request.method !== "POST") {
    return new Response(
      superjson.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  try {
    const { user } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    // Check if the new email is already taken by another user
    if (validatedInput.email && validatedInput.email !== user.email) {
      const existingUser = await db
        .selectFrom("users")
        .select("id")
        .where("email", "=", validatedInput.email)
        .where("id", "!=", user.id)
        .executeTakeFirst();

      if (existingUser) {
        return new Response(
          superjson.stringify({ error: "Email is already in use." }),
          { status: 409 }
        );
      }
    }

    const updatedUser = await db
      .updateTable("users")
      .set({
        ...validatedInput,
        updatedAt: new Date(),
      })
      .where("id", "=", user.id)
      .returning([
        "id",
        "email",
        "displayName",
        "avatarUrl",
        "role",
        "status",
        "address",
        "latitude",
        "longitude",
        "phone",
        "nationalId",
      ])
      .executeTakeFirstOrThrow();

    const responseUser = {
      ...updatedUser,
      latitude: updatedUser.latitude ? parseFloat(updatedUser.latitude) : null,
      longitude: updatedUser.longitude ? parseFloat(updatedUser.longitude) : null,
      phone: updatedUser.phone,
      nationalId: updatedUser.nationalId,
    };

    return new Response(superjson.stringify(responseUser satisfies OutputType));
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: error.errors }), {
        status: 400,
      });
    }
    if (error instanceof Error && error.message.includes("Not authenticated")) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }
    console.error("Error updating profile:", error);
    return new Response(
      superjson.stringify({ error: "Failed to update profile." }),
      { status: 500 }
    );
  }
}