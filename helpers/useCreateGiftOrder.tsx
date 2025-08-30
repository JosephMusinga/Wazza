import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postOrdersGift, InputType, OutputType } from "../endpoints/orders/gift_POST.schema";
import { AUTH_QUERY_KEY } from "./useAuth";

export const useCreateGiftOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: (newGiftOrder) => postOrdersGift(newGiftOrder),
    onSuccess: (data) => {
      // Invalidate queries that might be affected by a new order
      // For example, a user's order history list
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
      
      // If notifications are implemented for the user, invalidate them too
      queryClient.invalidateQueries({ queryKey: ["notifications", "user", data.buyerId] });
      
      console.log("Gift order created successfully:", data);
    },
    onError: (error) => {
      console.error("Failed to create gift order:", error);
      // Optionally, you can show a toast notification here
    },
  });
};