import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postOrders, InputType, OutputType } from "../endpoints/orders_POST.schema";
import { AUTH_QUERY_KEY } from "./useAuth";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: postOrders,
    onSuccess: () => {
      // Invalidate queries that would be affected by a new order
      // e.g., a user's order history list
      queryClient.invalidateQueries({ queryKey: ["orders", "history"] });
      // Potentially invalidate business-side order queries if applicable
      queryClient.invalidateQueries({ queryKey: ["business", "orders"] });
    },
    onError: (error) => {
      console.error("Failed to create order:", error);
    },
  });
};