import { useQuery } from "@tanstack/react-query";
import { getAdminAnalytics, InputType } from "../endpoints/admin/analytics_GET.schema";

export const useAdminAnalytics = (params: InputType = {}) => {
  const { startDate, endDate } = params;

  const queryKey = ["admin", "analytics", { startDate, endDate }];

  return useQuery({
    queryKey,
    queryFn: () => getAdminAnalytics({ startDate, endDate }),
  });
};