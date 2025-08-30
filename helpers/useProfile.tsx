import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../endpoints/profile_GET.schema";
import { AUTH_QUERY_KEY } from "./useAuth";

export const PROFILE_QUERY_KEY = ["profile", "me"] as const;

/**
 * A React hook to fetch the current user's profile.
 * It depends on the user being authenticated. The query is enabled only when the auth state is 'authenticated'.
 * It uses the same query key as the main auth session to ensure data consistency.
 *
 * @returns The same result as a `useQuery` call.
 */
export const useProfile = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEY, // Use the same key as useAuth to sync user data
    queryFn: async () => {
      const result = await getProfile();
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.user;
    },
    // This query should only run when the user is authenticated.
    // The `useAuth` hook manages the initial session check.
    // This hook is for components that need profile data and are rendered within a protected context.
    staleTime: 5 * 60 * 1000, // 5 minutes, same as global config
  });
};