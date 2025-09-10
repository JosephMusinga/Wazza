import { useQueryClient } from '@tanstack/react-query';

export const useBusinessesRefresh = () => {
  const queryClient = useQueryClient();

  const refreshBusinesses = () => {
    // Invalidate and refetch the businesses query
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
  };

  return { refreshBusinesses };
};

