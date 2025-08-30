import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import {
  postOrdersGiftVerify,
  InputType,
  OutputType,
} from "../endpoints/orders/gift/verify_POST.schema";

type UseVerifyGiftOptions = Omit<
  UseMutationOptions<OutputType, Error, InputType>,
  "mutationFn"
>;

export const useVerifyGift = (options?: UseVerifyGiftOptions) => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postOrdersGiftVerify(variables),
    ...options,
  });
};