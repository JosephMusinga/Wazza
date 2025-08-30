import { db } from '../helpers/db';
import { OutputType } from "./businesses_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  if (request.method !== "GET") {
    return new Response(
      superjson.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  try {
    const businesses = await db
      .selectFrom("businesses")
      .leftJoin("users", "users.id", "businesses.ownerId")
      .select([
        "businesses.id",
        "users.displayName as name",
        "businesses.address",
        "businesses.latitude",
        "businesses.longitude", 
        "businesses.description",
        "businesses.businessType"
      ])
      .where("businesses.status", "=", "active")
      .execute();

    console.log(`Fetched ${businesses.length} businesses from database`);

    // Filter out businesses with missing required fields and convert to proper types
    const validBusinesses = businesses
      .filter(business => 
        business.name && 
        business.address && 
        business.latitude !== null && 
        business.longitude !== null
      )
      .map(business => ({
        id: business.id,
        name: business.name!,
        address: business.address!,
        latitude: parseFloat(business.latitude!.toString()),
        longitude: parseFloat(business.longitude!.toString()),
        description: business.description || `${business.name} - ${business.businessType || 'Business'}`
      }));

    console.log(`Returning ${validBusinesses.length} valid businesses with complete location data`);

    return new Response(
      superjson.stringify(validBusinesses satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return new Response(
      superjson.stringify({ error: "Failed to fetch businesses." }),
      { status: 500 }
    );
  }
}