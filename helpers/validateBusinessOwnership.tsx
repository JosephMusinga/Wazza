import { db } from './db';
import { User } from './schema';

/**
 * Validates that a user owns a specific business
 * @param userId - The ID of the user
 * @param businessId - The ID of the business to validate ownership for
 * @returns Promise<boolean> - true if user owns the business, false otherwise
 */
export async function validateBusinessOwnership(userId: number, businessId: number): Promise<boolean> {
  try {
    const business = await db
      .selectFrom('businesses')
      .select('id')
      .where('id', '=', businessId)
      .where('ownerId', '=', userId)
      .where('status', '=', 'active')
      .executeTakeFirst();

    return !!business;
  } catch (error) {
    console.error('Error validating business ownership:', error);
    return false;
  }
}

/**
 * Gets the business ID owned by a user
 * @param userId - The ID of the user
 * @returns Promise<number | null> - The business ID if found, null otherwise
 */
export async function getUserBusinessId(userId: number): Promise<number | null> {
  try {
    const business = await db
      .selectFrom('businesses')
      .select('id')
      .where('ownerId', '=', userId)
      .where('status', '=', 'active')
      .executeTakeFirst();

    return business?.id || null;
  } catch (error) {
    console.error('Error getting user business ID:', error);
    return null;
  }
}

/**
 * Validates that a user is a business owner and gets their business ID
 * @param user - The user object
 * @returns Promise<{ isValid: boolean; businessId: number | null; error?: string }>
 */
export async function validateBusinessUser(user: User): Promise<{
  isValid: boolean;
  businessId: number | null;
  error?: string;
}> {
  if (user.role !== 'business') {
    return {
      isValid: false,
      businessId: null,
      error: 'User is not a business owner'
    };
  }

  const businessId = await getUserBusinessId(user.id);
  
  if (!businessId) {
    return {
      isValid: false,
      businessId: null,
      error: 'No active business found for this user'
    };
  }

  return {
    isValid: true,
    businessId
  };
}
