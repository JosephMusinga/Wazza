import React, { useState } from 'react';
import { Product } from '../endpoints/business/products_GET.schema';
import { useBusinessProducts } from '../helpers/useBusinessProductManagement';
import { Button } from './Button';
import { Plus, Image as ImageIcon, AlertCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from './Skeleton';
import styles from './BusinessProductManagement.module.css';
import { AddProductDialog } from './AddProductDialog';
import { EditProductDialog } from './EditProductDialog';
import { DeleteProductDialog } from './DeleteProductDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './DropdownMenu';

const ProductCardSkeleton = () => (
  <div className={styles.productCard}>
    <div className={styles.imagePlaceholder}>
      <Skeleton className={styles.skeletonImage} />
    </div>
    <div className={styles.productInfo}>
      <Skeleton style={{ height: '1.25rem', width: '80%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '40%', marginBottom: 'var(--spacing-3)' }} />
      <Skeleton style={{ height: '0.875rem', width: '100%' }} />
      <Skeleton style={{ height: '0.875rem', width: '90%', marginTop: 'var(--spacing-1)' }} />
    </div>
    <div className={styles.productFooter}>
      <Skeleton style={{ height: '1.5rem', width: '50px' }} />
    </div>
  </div>
);

export const BusinessProductManagement = ({ className }: { className?: string }) => {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { data: products, isFetching, error } = useBusinessProducts();

  return (
    <>
      <div className={`${styles.container} ${className || ''}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>My Products</h1>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus size={18} />
            <span className={styles.buttonText}>Add Product</span>
          </Button>
        </header>

        {isFetching && (
          <div className={styles.productList}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h2>Could not load products</h2>
            <p>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
          </div>
        )}

        {!isFetching && !error && products && (
          <>
            {products.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No products yet</h2>
                <p>Start by adding your first product to your catalog.</p>
                <Button onClick={() => setAddDialogOpen(true)} variant="secondary">
                  <Plus size={18} />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className={styles.productList}>
                {products.map((product) => (
                  <div key={product.id} className={styles.productCard}>
                    <div className={styles.imageContainer}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <ImageIcon size={48} className={styles.placeholderIcon} />
                        </div>
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productPrice}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                      </p>
                      {product.category && <span className={styles.productCategory}>{product.category}</span>}
                      <p className={styles.productDescription}>{product.description}</p>
                    </div>
                    <div className={styles.productFooter}>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditingProduct(product)}>
                            <Edit size={14} />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeletingProduct(product)} className={styles.deleteMenuItem}>
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AddProductDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {}}
      />

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          isOpen={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSuccess={() => {}}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          product={deletingProduct}
          isOpen={!!deletingProduct}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
          onSuccess={() => {}}
        />
      )}
    </>
  );
};