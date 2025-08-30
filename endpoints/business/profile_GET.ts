import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../helpers/getSetServerSession';
import { OutputType } from './profile_GET.schema';
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(superjson.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== 'business') {
      return new Response(
        superjson.stringify({
          error: 'Forbidden: User is not a business owner.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const business = await db
      .selectFrom('businesses')
      .selectAll()
      .where('ownerId', '=', user.id)
      .executeTakeFirst();

    if (!business) {
      return new Response(
        superjson.stringify({
          error: 'Not Found: Business profile not found for this user.',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const responsePayload: OutputType = {
      businessProfile: {
        id: business.id,
        businessName: business.businessName,
        address: business.address,
        latitude: business.latitude ? parseFloat(business.latitude) : null,
        longitude: business.longitude ? parseFloat(business.longitude) : null,
        description: business.description,
        businessType: business.businessType,
        status: business.status,
        phone: business.phone,
        website: business.website,
      },
    };

    return new Response(superjson.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Error fetching business profile:', error);
    return new Response(
      superjson.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}