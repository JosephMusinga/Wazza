import React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { Product } from '../endpoints/business/products_GET.schema';
import { useDeleteProduct } from '../helpers/useBusinessProductManagement';

interface DeleteProductDialogProps {
  product: Product;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DeleteProductDialog = ({ product, isOpen, onOpenChange, onSuccess }: DeleteProductDialogProps) => {
  const deleteProductMutation = useDeleteProduct();

  const handleDelete = () => {
    deleteProductMutation.mutate({ productId: product.id }, {
      onSuccess: () => {
        toast.success('Product deleted successfully!');
        onSuccess();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to delete product.');
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{product.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteProductMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending && <Spinner size="sm" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};