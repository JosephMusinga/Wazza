import React from 'react';
import { z } from 'zod';
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage } from './Form';
import { schema as updateProductSchema } from '../endpoints/business/products/update_POST.schema';
import { Product } from '../endpoints/business/products_GET.schema';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Spinner } from './Spinner';
import styles from './AddProductForm.module.css'; // Reusing styles from AddProductForm

type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

interface EditProductFormProps {
  product: Product;
  onSubmit: (data: Omit<UpdateProductFormValues, 'productId'>) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const EditProductForm = ({ product, onSubmit, isSubmitting, onCancel }: EditProductFormProps) => {
  const form = useForm({
    schema: updateProductSchema.omit({ productId: true }),
    defaultValues: {
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
      imageUrl: product.imageUrl || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        <FormItem name="name">
          <FormLabel>Product Name</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Artisan Sourdough Bread"
              value={form.values.name}
              onChange={(e) => form.setValues((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="price">
          <FormLabel>Price</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder="0.00"
              value={form.values.price}
              onChange={(e) => form.setValues((prev) => ({ ...prev, price: e.target.valueAsNumber || 0 }))}
              disabled={isSubmitting}
              step="0.01"
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="description">
          <FormLabel>Description (Optional)</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe your product..."
              value={form.values.description || ''}
              onChange={(e) => form.setValues((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="category">
          <FormLabel>Category (Optional)</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Baked Goods"
              value={form.values.category || ''}
              onChange={(e) => form.setValues((prev) => ({ ...prev, category: e.target.value }))}
              disabled={isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="imageUrl">
          <FormLabel>Image URL (Optional)</FormLabel>
          <FormControl>
            <Input
              placeholder="https://example.com/image.jpg"
              value={form.values.imageUrl || ''}
              onChange={(e) => form.setValues((prev) => ({ ...prev, imageUrl: e.target.value }))}
              disabled={isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};