import {
  setServerSession,
  NotAuthenticatedError } from
'../helpers/getSetServerSession';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { OutputType } from "./profile_GET.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user, session } = await getServerUserSession(request);

    const responsePayload: OutputType = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        phone: user.phone,
        nationalId: user.nationalId
      }
    };

    const response = new Response(superjson.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" }
    });

    // Update the session cookie with the new lastAccessed time to keep it alive
    await setServerSession(response, {
      id: session.id,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed.getTime()
    });

    return response;
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      const errorPayload: OutputType = { error: "Not authenticated" };
      return new Response(superjson.stringify(errorPayload), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("Get profile error:", error);
    const errorPayload: OutputType = { error: "Failed to fetch profile" };
    return new Response(superjson.stringify(errorPayload), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}