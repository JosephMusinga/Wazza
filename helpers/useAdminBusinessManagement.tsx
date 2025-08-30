import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminBusinesses, InputType as GetAdminBusinessesInput, OutputType as GetAdminBusinessesOutput, BusinessAdminView } from "../endpoints/admin/businesses_GET.schema";
import { postApproveBusiness } from "../endpoints/admin/businesses/approve_POST.schema";
import { postRejectBusiness } from "../endpoints/admin/businesses/reject_POST.schema";
import { postSuspendBusiness } from "../endpoints/admin/businesses/suspend_POST.schema";
import { postBanBusiness } from "../endpoints/admin/businesses/ban_POST.schema";
import { BusinessStatus } from "./schema";

export const ADMIN_BUSINESSES_QUERY_KEY = "adminBusinesses";

/**
 * Query hook for fetching a paginated and filterable list of businesses.
 * @param params - The query parameters for filtering and pagination.
 */
export const useAdminBusinesses = (params: GetAdminBusinessesInput) => {
  const queryKey = [ADMIN_BUSINESSES_QUERY_KEY, params];

  return useQuery<GetAdminBusinessesOutput, Error>({
    queryKey,
    queryFn: () => getAdminBusinesses(params),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const useBusinessStatusMutation = (
  mutationFn: (vars: { businessId: number }) => Promise<any>,
  successMessage: string,
  optimisticStatus: BusinessStatus
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async ({ businessId }) => {
      await queryClient.cancelQueries({ queryKey: [ADMIN_BUSINESSES_QUERY_KEY] });

      const previousBusinessesData = queryClient.getQueriesData<GetAdminBusinessesOutput>({ queryKey: [ADMIN_BUSINESSES_QUERY_KEY] });

      queryClient.setQueriesData<GetAdminBusinessesOutput>({ queryKey: [ADMIN_BUSINESSES_QUERY_KEY] }, (oldData) => {
        if (!oldData || 'error' in oldData) return oldData;

        const newBusinesses = oldData.businesses.map(business =>
          business.id === businessId ? { ...business, status: optimisticStatus } : business
        );

        return { ...oldData, businesses: newBusinesses };
      });

      return { previousBusinessesData };
    },
    onSuccess: (data) => {
      if (data && 'error' in data) {
        toast.error(data.error);
        queryClient.invalidateQueries({ queryKey: [ADMIN_BUSINESSES_QUERY_KEY] });
      } else {
        toast.success(successMessage);
        queryClient.invalidateQueries({ queryKey: [ADMIN_BUSINESSES_QUERY_KEY] });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousBusinessesData) {
        context.previousBusinessesData.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });
};

/**
 * Mutation hook for approving a business.
 */
export const useAdminApproveBusiness = () => {
  return useBusinessStatusMutation(postApproveBusiness, "Business approved successfully.", "active");
};

/**
 * Mutation hook for rejecting a business.
 */
export const useAdminRejectBusiness = () => {
  return useBusinessStatusMutation(postRejectBusiness, "Business rejected successfully.", "rejected");
};

/**
 * Mutation hook for suspending a business.
 */
export const useAdminSuspendBusiness = () => {
  return useBusinessStatusMutation(postSuspendBusiness, "Business suspended successfully.", "suspended");
};

/**
 * Mutation hook for banning a business.
 */
export const useAdminBanBusiness = () => {
  return useBusinessStatusMutation(postBanBusiness, "Business banned successfully.", "banned");
};