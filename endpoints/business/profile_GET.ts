import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../helpers/getSetServerSession';
import { validateBusinessUser } from '../../helpers/validateBusinessOwnership';
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

    console.log('Business Profile Debug - User:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Validate business user and get their business ID
    const validation = await validateBusinessUser(user);
    
    if (!validation.isValid) {
      console.log('Business Profile Debug - Validation Failed:', validation.error);
      return new Response(
        superjson.stringify({
          error: validation.error || 'Forbidden: User is not a business owner.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const business = await db
      .selectFrom('businesses')
      .selectAll()
      .where('id', '=', validation.businessId!)
      .executeTakeFirst();

    console.log('Business Profile Debug - Query Result:', {
      userId: user.id,
      businessId: validation.businessId,
      businessFound: !!business,
      businessName: business?.businessName
    });

    if (!business) {
      console.error('SECURITY ALERT: Business not found after validation!', {
        userId: user.id,
        businessId: validation.businessId
      });
      return new Response(
        superjson.stringify({
          error: 'Not Found: Business profile not found.',
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