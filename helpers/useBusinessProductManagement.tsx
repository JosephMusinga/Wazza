import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBusinessProducts,
  Product,
} from "../endpoints/business/products_GET.schema";
import {
  postBusinessProduct,
  InputType as AddProductInput,
} from "../endpoints/business/products_POST.schema";
import {
  postUpdateBusinessProduct,
  InputType as UpdateProductInput,
} from "../endpoints/business/products/update_POST.schema";
import {
  postDeleteBusinessProduct,
  InputType as DeleteProductInput,
} from "../endpoints/business/products/delete_POST.schema";

export const businessProductsQueryKey = ["business", "products"];

/**
 * Query hook to fetch the products for the currently authenticated business owner.
 */
export const useBusinessProducts = () => {
  return useQuery({
    queryKey: businessProductsQueryKey,
    queryFn: getBusinessProducts,
  });
};

/**
 * Mutation hook to add a new product.
 * Invalidates the business products query on success.
 */
export const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProduct: AddProductInput) =>
      postBusinessProduct(newProduct),
    onSuccess: (newProduct) => {
      // Invalidate and refetch to get the most up-to-date list
      queryClient.invalidateQueries({ queryKey: businessProductsQueryKey });

      // Or, for a faster UI update, we can optimistically add the new product to the cache
      // queryClient.setQueryData<Product[]>(businessProductsQueryKey, (oldData) => {
      //   return oldData ? [newProduct, ...oldData] : [newProduct];
      // });
    },
    onError: (error) => {
      console.error("Error adding product:", error);
      // Error handling, e.g., showing a toast notification, is typically done in the component.
    },
  });
};

/**
 * Mutation hook to update an existing product.
 * Uses optimistic updates for a better user experience.
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedProductData: UpdateProductInput) =>
      postUpdateBusinessProduct(updatedProductData),
    onMutate: async (updatedProductData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: businessProductsQueryKey });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData<Product[]>(
        businessProductsQueryKey
      );

      // Optimistically update to the new value
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          businessProductsQueryKey,
          previousProducts.map((product) =>
            product.id === updatedProductData.productId
              ? { ...product, ...updatedProductData }
              : product
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      console.error("Error updating product:", err);
      // Rollback to the previous state on error
      if (context?.previousProducts) {
        queryClient.setQueryData(
          businessProductsQueryKey,
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: businessProductsQueryKey });
    },
  });
};

/**
 * Mutation hook to delete a product.
 * Uses optimistic updates for a better user experience.
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deleteData: DeleteProductInput) =>
      postDeleteBusinessProduct(deleteData),
    onMutate: async (deleteData) => {
      await queryClient.cancelQueries({ queryKey: businessProductsQueryKey });

      const previousProducts = queryClient.getQueryData<Product[]>(
        businessProductsQueryKey
      );

      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          businessProductsQueryKey,
          previousProducts.filter(
            (product) => product.id !== deleteData.productId
          )
        );
      }

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      console.error("Error deleting product:", err);
      if (context?.previousProducts) {
        queryClient.setQueryData(
          businessProductsQueryKey,
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: businessProductsQueryKey });
    },
  });
};