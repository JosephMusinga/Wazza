import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import {
  postOrdersVerify,
  InputType,
  OutputType,
} from "../endpoints/orders/verify_POST.schema";

type UseVerifyOrderOptions = Omit<
  UseMutationOptions<OutputType, Error, InputType>,
  "mutationFn"
>;

export const useVerifyOrder = (options?: UseVerifyOrderOptions) => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postOrdersVerify(variables),
    onSuccess: (data, variables, context) => {
      // Invalidate queries related to orders to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
      
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};