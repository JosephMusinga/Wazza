import React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './Dialog';
import { EditProductForm } from './EditProductForm';
import { InputType as UpdateProductInput } from '../endpoints/business/products/update_POST.schema';
import { Product } from '../endpoints/business/products_GET.schema';
import { useUpdateProduct } from '../helpers/useBusinessProductManagement';

interface EditProductDialogProps {
  product: Product;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditProductDialog = ({ product, isOpen, onOpenChange, onSuccess }: EditProductDialogProps) => {
  const editProductMutation = useUpdateProduct();

  const handleSubmit = (data: Omit<UpdateProductInput, 'productId'>) => {
    editProductMutation.mutate({ productId: product.id, ...data }, {
      onSuccess: () => {
        toast.success('Product updated successfully!');
        onSuccess();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to update product.');
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the details for "{product.name}".
          </DialogDescription>
        </DialogHeader>
        
        <EditProductForm
          product={product}
          onSubmit={handleSubmit}
          isSubmitting={editProductMutation.isPending}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};