import { z } from 'zod';
import superjson from 'superjson';
import { BusinessStatusArrayValues, BusinessStatus } from '../../helpers/schema';

// No input schema for a simple GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type BusinessProfile = {
  id: number;
  businessName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  businessType: string | null;
  status: BusinessStatus;
  phone: string | null;
  website: string | null;
};

export type OutputType =
  | {
      businessProfile: BusinessProfile;
    }
  | {
      error: string;
    };

export const getBusinessProfile = async (
  init?: RequestInit
): Promise<OutputType> => {
  const response = await fetch(`/_api/business/profile`, {
    method: 'GET',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = superjson.parse<OutputType>(text);

  if (!response.ok) {
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
      throw new Error(data.error);
    }
    throw new Error('Failed to fetch business profile.');
  }

  return data;
};