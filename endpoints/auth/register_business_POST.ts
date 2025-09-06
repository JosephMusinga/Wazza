import { db } from "../../helpers/db";
import { schema } from "./register_business_POST.schema";
import { randomBytes } from "crypto";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import { createNotification } from "../../helpers/notificationService";

export async function handle(request: Request) {
  try {
    console.log("Business registration request received");
    
    const requestText = await request.text();
    console.log("Request body:", requestText);
    
    let json;
    try {
      json = JSON.parse(requestText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return Response.json(
        { message: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }
    
    console.log("Parsed JSON:", json);
    
    const validatedData = schema.parse(json);
    const {
      email,
      password,
      displayName,
      phone,
      nationalId,
      role,
      businessName,
      businessType,
      businessDescription,
      businessPhone,
      businessWebsite,
      latitude,
      longitude,
      address,
    } = validatedData;

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

    // Create new user and business in a transaction
    const result = await db.transaction().execute(async (trx) => {
      // Insert the user
      const [user] = await trx
        .insertInto("users")
        .values({
          email,
          displayName,
          phone,
          nationalId,
          role,
          status: "pending", // Set initial status to pending for admin approval
          address: "Harare, Zimbabwe", // Default user address
          latitude: "-17.8252",
          longitude: "31.0335",
        })
        .returning(["id", "email", "displayName", "createdAt"])
        .execute();

      // Store the password hash
      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash,
        })
        .execute();

      // Create the business record with pending status
      const [business] = await trx
        .insertInto("businesses")
        .values({
          ownerId: user.id,
          businessName,
          businessType,
          description: businessDescription || null,
          phone: businessPhone,
          website: businessWebsite || null,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          address,
          status: "pending", // Start with pending approval
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning(["id", "businessName", "status"])
        .execute();

      // Create notification for admins about new business registration
      await createNotification(trx, {
        recipientId: 1, // Assuming admin user ID is 1, you might want to make this dynamic
        recipientType: 'user',
        type: 'system_announcement',
        title: 'New Business Registration',
        message: `New business "${businessName}" registered and awaiting approval.`,
        data: { businessId: business.id, businessName, ownerEmail: email }
      });

      return { user, business };
    });

    // Create a new session
    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: result.user.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
      })
      .execute();

    // Create response with user and business data
    const responseData = {
      user: {
        ...result.user,
        role,
      },
      business: result.business,
    };

    // Create response
    const response = Response.json(responseData);

    // Set session cookie
    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
    });

    return response;
  } catch (error: unknown) {
    console.error("Business registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Business registration failed";
    return Response.json({ message: errorMessage }, { status: 400 });
  }
}
