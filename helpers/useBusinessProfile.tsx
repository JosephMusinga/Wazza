import { useQuery } from '@tanstack/react-query';
import { getBusinessProfile } from '../endpoints/business/profile_GET.schema';
import { useAuth } from './useAuth';

export const BUSINESS_PROFILE_QUERY_KEY = ['business', 'profile'] as const;

export const useBusinessProfile = () => {
  const { authState } = useAuth();

  return useQuery({
    queryKey: BUSINESS_PROFILE_QUERY_KEY,
    queryFn: getBusinessProfile,
    // Only enable the query if the user is authenticated and is a business owner.
    enabled: authState.type === 'authenticated' && authState.user.role === 'business',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};