import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./ban_POST.schema";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Users } from "../../../helpers/schema";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user: adminUser } = await getServerUserSession(request);

    if (adminUser.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = await superjson.parse(await request.text());
    const { userId } = schema.parse(json);

    if (userId === adminUser.id) {
        return new Response(
            superjson.stringify({ error: "Admins cannot ban themselves" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const updatedUser = await db
      .updateTable("users")
      .set({ status: "banned", updatedAt: new Date() })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedUser) {
      return new Response(
        superjson.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const responsePayload: OutputType = {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        status: updatedUser.status,
        address: updatedUser.address,
        latitude: updatedUser.latitude ? parseFloat(updatedUser.latitude) : null,
        longitude: updatedUser.longitude ? parseFloat(updatedUser.longitude) : null,
        phone: updatedUser.phone,
        nationalId: updatedUser.nationalId,
      },
    };

    return new Response(superjson.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Failed to ban user:", error);
    return new Response(
      superjson.stringify({ error: "Failed to ban user" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}