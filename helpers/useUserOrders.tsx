import { useQuery } from "@tanstack/react-query";
import { getOrders, InputType } from "../endpoints/orders_GET.schema";

export const USER_ORDERS_QUERY_KEY = "userOrders";

export const useUserOrders = (params: InputType) => {
  return useQuery({
    queryKey: [USER_ORDERS_QUERY_KEY, params],
    queryFn: () => getOrders(params),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    placeholderData: (d) => d,
  });
};