import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBusinessOrders,
  InputType as GetOrdersInput,
  Order,
} from "../endpoints/business/orders_GET.schema";
import {
  postBusinessOrderStatus,
  InputType as UpdateStatusInput,
} from "../endpoints/business/orders/status_POST.schema";
import { toast } from "sonner";

export const BUSINESS_ORDERS_QUERY_KEY = "businessOrders" as const;

export const useBusinessOrders = (params: GetOrdersInput) => {
  return useQuery({
    queryKey: [BUSINESS_ORDERS_QUERY_KEY, params],
    queryFn: () => getBusinessOrders(params),
    placeholderData: (previousData) => previousData,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // 10 seconds
  });
};

export const useUpdateBusinessOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStatusInput) => postBusinessOrderStatus(data),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      // Invalidate all business order queries to refetch and show updated status
      queryClient.invalidateQueries({ queryKey: [BUSINESS_ORDERS_QUERY_KEY] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update order status.");
    },
  });
};