import React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './Dialog';
import { AddProductForm } from './AddProductForm';
import { InputType as AddProductInput } from '../endpoints/business/products_POST.schema';
import { useAddProduct } from '../helpers/useBusinessProductManagement';

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddProductDialog = ({ isOpen, onOpenChange, onSuccess }: AddProductDialogProps) => {
  const addProductMutation = useAddProduct();

  const handleSubmit = (data: AddProductInput) => {
    addProductMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Product added successfully!');
        onSuccess();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to add product.');
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new product to your catalog.
          </DialogDescription>
        </DialogHeader>
        
        <AddProductForm 
          onSubmit={handleSubmit} 
          isSubmitting={addProductMutation.isPending}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};