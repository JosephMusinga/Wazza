// adapt this to the database schema and helpers if necessary
import { db } from "../../helpers/db";
import { schema } from "./register_with_password_POST.schema";
import { randomBytes } from "crypto";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, password, displayName, phone, nationalId, role } = schema.parse(json);

    // Check if email already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      return Response.json(
        { message: "email already in use" },
        { status: 409 }
      );
    }

    // Check if national ID already exists
    const existingNationalId = await db
      .selectFrom("users")
      .select("id")
      .where("nationalId", "=", nationalId)
      .limit(1)
      .execute();

    if (existingNationalId.length > 0) {
      return Response.json(
        { message: "national ID already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await generatePasswordHash(password);

    // Create new user
    const newUser = await db.transaction().execute(async (trx) => {
      // Insert the user with default location (Harare, Zimbabwe)
      const [user] = await trx
        .insertInto("users")
        .values({
          email,
          displayName,
          phone,
          nationalId,
          role,
          address: "Harare, Zimbabwe",
          latitude: "-17.8252",
          longitude: "31.0335",
        })
        .returning(["id", "email", "displayName", "createdAt"])
        .execute();

      // Store the password hash in another table
      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash,
        })
        .execute();

      return user;
    });

    // Create a new session
    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: newUser.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
      })
      .execute();

    // Create response with user data
    const response = Response.json({
      user: {
        ...newUser,
        role,
      },
    });

    // Set session cookie
    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
    });

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    return Response.json({ message: errorMessage }, { status: 400 });
  }
}
