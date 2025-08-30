import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  postOrdersGiftRedeem,
  InputType,
  OutputType,
} from "../endpoints/orders/gift/redeem_POST.schema";

type UseRedeemGiftOptions = Omit<
  UseMutationOptions<OutputType, Error, InputType>,
  "mutationFn"
>;

export const useRedeemGift = (options?: UseRedeemGiftOptions) => {
  return useMutation<OutputType, Error, InputType>({
    mutationFn: (variables) => postOrdersGiftRedeem(variables),
    ...options,
  });
};