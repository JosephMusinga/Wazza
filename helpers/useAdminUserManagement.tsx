import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminUsers, InputType as GetAdminUsersInput, OutputType as GetAdminUsersOutput, UserAdminView } from "../endpoints/admin/users_GET.schema";
import { postSuspendUser } from "../endpoints/admin/users/suspend_POST.schema";
import { postBanUser } from "../endpoints/admin/users/ban_POST.schema";
import { postReactivateUser } from "../endpoints/admin/users/reactivate_POST.schema";

export const ADMIN_USERS_QUERY_KEY = "adminUsers";

/**
 * Query hook for fetching a paginated and filterable list of users.
 * @param params - The query parameters for filtering and pagination.
 */
export const useAdminUsers = (params: GetAdminUsersInput) => {
  const queryKey = [ADMIN_USERS_QUERY_KEY, params];

  return useQuery<GetAdminUsersOutput, Error>({
    queryKey,
    queryFn: () => getAdminUsers(params),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const useUserStatusMutation = (
  mutationFn: (vars: { userId: number }) => Promise<any>,
  successMessage: string,
  optimisticStatus: 'active' | 'suspended' | 'banned'
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async ({ userId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] });

      // Snapshot the previous value
      const previousUsersData = queryClient.getQueriesData<GetAdminUsersOutput>({ queryKey: [ADMIN_USERS_QUERY_KEY] });

      // Optimistically update to the new value
      queryClient.setQueriesData<GetAdminUsersOutput>({ queryKey: [ADMIN_USERS_QUERY_KEY] }, (oldData) => {
        if (!oldData || 'error' in oldData) return oldData;

        const newUsers = oldData.users.map(user =>
          user.id === userId ? { ...user, status: optimisticStatus } : user
        );

        return { ...oldData, users: newUsers };
      });

      // Return a context object with the snapshotted value
      return { previousUsersData };
    },
    onSuccess: (data) => {
      if ('error' in data) {
        toast.error(data.error);
        // Revert on known API error
        queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] });
      } else {
        toast.success(successMessage);
        // Invalidate to refetch the latest data from server
        queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] });
      }
    },
    onError: (err, variables, context) => {
      // Rollback on network or unexpected error
      if (context?.previousUsersData) {
        context.previousUsersData.forEach(([key, value]) => {
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
 * Mutation hook for suspending a user.
 */
export const useAdminSuspendUser = () => {
  return useUserStatusMutation(postSuspendUser, "User suspended successfully.", "suspended");
};

/**
 * Mutation hook for banning a user.
 */
export const useAdminBanUser = () => {
  return useUserStatusMutation(postBanUser, "User banned successfully.", "banned");
};

/**
 * Mutation hook for reactivating a user.
 */
export const useAdminReactivateUser = () => {
  return useUserStatusMutation(postReactivateUser, "User reactivated successfully.", "active");
};