import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBusinessProducts } from "../endpoints/businesses/products_GET.schema";
import { useShoppingCart, CartItem } from "../helpers/useShoppingCart";
import { useCreateOrder } from "../helpers/useCreateOrder";
import { useIsMobile } from "../helpers/useIsMobile";
import { Skeleton } from "./Skeleton";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { Spinner } from "./Spinner";
import { UserGiftPurchase } from "./UserGiftPurchase";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "./Dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  PackageCheck,
  User,
  Gift,
  ArrowLeft,
  Copy,
  MapPin,
} from "lucide-react";
import styles from "./UserProductBrowsing.module.css";

interface UserProductBrowsingProps {
  businessId: number;
  className?: string;
  business?: {
    name: string;
    businessType: string | null;
    address: string;
    phone: string | null;
    website: string | null;
    description: string | null;
  };
}

type PurchaseType = "selection" | "receipt" | "self" | "gift";

const ProductCardSkeleton: React.FC = () => (
  <div className={styles.productCard}>
    <Skeleton className={styles.productImageSkeleton} />
    <div className={styles.productInfo}>
      <Skeleton style={{ height: "1.25rem", width: "40%", marginBottom: "0.5rem" }} />
      <Skeleton style={{ height: "1.25rem", width: "80%", marginBottom: "0.5rem" }} />
      <Skeleton style={{ height: "1rem", width: "60%", marginBottom: "1rem" }} />
      <Skeleton style={{ height: "2.5rem", width: "60%" }} />
    </div>
  </div>
);

export const UserProductBrowsing: React.FC<UserProductBrowsingProps> = ({
  businessId,
  className,
  business,
}) => {
  const { data: products, isFetching, error } = useQuery({
    queryKey: ["businessProducts", businessId],
    queryFn: () => getBusinessProducts({ businessId: String(businessId) }),
    enabled: !!businessId,
    placeholderData: (prev) => prev,
  });

  const { addItem, updateQuantity, removeItem, cartForBusiness } = useShoppingCart();
  const createOrderMutation = useCreateOrder();
  const isMobile = useIsMobile();


  const [purchaseType, setPurchaseType] = useState<PurchaseType>("selection");
  const [orderData, setOrderData] = useState<{id: number; redemptionCode: string} | null>(null);
  const [businessInfoOpen, setBusinessInfoOpen] = useState(false);

  const businessCart = useMemo(() => cartForBusiness(businessId), [cartForBusiness, businessId]);
  const businessCartItems = Object.values(businessCart);
  
  const totalQuantity = useMemo(() => {
    return businessCartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [businessCartItems]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Pickup code copied to clipboard");
    });
  }, []);

  const totalCartPrice = useMemo(() => {
    return businessCartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [businessCartItems]);

  const handleAddToCart = (product: any) => {
    addItem(product);
    console.log(`Added ${product.name} to cart for business ${businessId}`);
  };

  const clearBusinessCart = useCallback(() => {
    businessCartItems.forEach(item => updateQuantity(item.product.id, 0));
  }, [businessCartItems, updateQuantity]);

  const handleCheckout = async () => {
    if (businessCartItems.length === 0) return;

    const orderItems = businessCartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    console.log('Starting checkout process for business:', businessId);
    createOrderMutation.mutate({
      businessId,
      items: orderItems,
      shippingAddress: "In-store pickup",
    }, {
      onSuccess: (data) => {
        console.log('Order created successfully:', data);
        setOrderData({ id: data.id, redemptionCode: data.redemptionCode || '' });
        setPurchaseType("self");
      },
      onError: (error) => {
        console.error('Checkout failed:', error);
      }
    });
  };



  const handleGiftComplete = () => {
    // Clear the cart items that were used for the gift
    clearBusinessCart();
    setPurchaseType("selection");
    console.log('Gift purchase completed, cart cleared');
  };

  if (isFetching && !products) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.loadingHeader}>
          <Skeleton style={{ height: "2rem", width: "200px", marginBottom: "1rem" }} />
          <Skeleton style={{ height: "1rem", width: "300px" }} />
        </div>
        <div className={styles.productGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.container} ${styles.errorState} ${className || ""}`}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <h3 className={styles.errorTitle}>Failed to load products</h3>
        <p className={styles.errorMessage}>{error.message}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className={styles.retryButton}
        >
          Try Again
        </Button>
      </div>
    );
  }

  const renderCartContent = () => {
    if (createOrderMutation.isSuccess && purchaseType === "self") {
      return (
        <div className={styles.successState}>
          <PackageCheck size={64} className={styles.successIcon} />
          <h3 className={styles.successTitle}>Order #{orderData?.id} Placed!</h3>
          <p className={styles.successMessage}>
            Present both the order number and redemption code at the business to collect your order.
          </p>
          <div className={styles.orderDetailsWrapper}>
            <div className={styles.orderDetail}>
              <span className={styles.orderDetailLabel}>Order Number:</span>
              <span className={styles.orderDetailValue}>#{orderData?.id}</span>
            </div>
            <div className={styles.orderDetail}>
              <span className={styles.orderDetailLabel}>Redemption Code:</span>
              <div className={styles.redemptionCodeWrapper}>
                <span className={styles.redemptionCode}>{orderData?.redemptionCode}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(orderData?.redemptionCode || '')}
                  aria-label="Copy redemption code"
                >
                  <Copy size={20} />
                </Button>
              </div>
            </div>
          </div>
          <DialogClose asChild>
            <Button onClick={() => {
              clearBusinessCart();
              createOrderMutation.reset();
              setPurchaseType("selection");
              setOrderData(null);
            }}>
              Continue Shopping
            </Button>
          </DialogClose>
        </div>
      );
    }

    if (purchaseType === "gift") {
      return (
        <div className={styles.giftPurchaseContainer}>
          <UserGiftPurchase 
            preselectedBusinessId={businessId}
            className={styles.embeddedGiftPurchase}
            onComplete={handleGiftComplete}
            onCancel={() => setPurchaseType("selection")}
          />
        </div>
      );
    }

    if (purchaseType === "selection") {
      return (
        <>
          <div className={styles.cartItemsList}>
            {businessCartItems.map(({ product, quantity }) => {
            return (
              <div key={product.id} className={styles.cartItem}>
                                <div className={styles.quantityControls}>
                  <Button 
                    size="icon-sm" 
                    variant="ghost" 
                    className={styles.quantityButton} 
                    onClick={() => updateQuantity(product.id, Math.min(99, quantity + 1))}
                    disabled={quantity >= 99}
                    aria-label={`Increase quantity of ${product.name}`}
                  >
                    <Plus size={14} />
                  </Button>
                  <Button 
                    size="icon-sm" 
                    variant="ghost" 
                    className={styles.quantityButton} 
                    onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label={`Decrease quantity of ${product.name}`}
                  >
                    <Minus size={14} />
                  </Button>
                </div>
                <div className={styles.cartItemContent}>
                  <img 
                    src={product.imageUrl || "https://via.placeholder.com/100"} 
                    alt={product.name} 
                    className={styles.cartItemImage} 
                  />
                  <div className={styles.cartItemDetails}>
                    <span className={styles.cartItemName}>{product.name} × {quantity}</span>
                    <span className={styles.cartItemPrice}>${(product.price * quantity).toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  size="icon-sm" 
                  variant="ghost" 
                  className={styles.removeItemButton} 
                  onClick={() => removeItem(product.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            );
          })}
          </div>

          <div className={styles.cartSummary}>
            <div className={styles.totalPrice}>
              <span>Total:</span>
              <span>${totalCartPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.purchaseOptions}>
            <div className={styles.purchaseOptionButtons}>
              <Button 
                onClick={() => setPurchaseType("gift")}
                className={styles.continueButton}
                size="lg"
              >
                Accept & Continue
              </Button>
            </div>
          </div>
        </>
      );
    }

    if (purchaseType === "receipt") {
      return (
        <div className={styles.receiptContainer}>
          <div className={styles.receiptHeader}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setPurchaseType("selection")}
              className={styles.backButton}
            >
              <ArrowLeft size={20} />
            </Button>
            <h3>Order Summary</h3>
          </div>
          
          <div className={styles.orderSummary}>
            <h4>Your Order</h4>
            {businessCartItems.map(({ product, quantity }) => (
              <div key={product.id} className={styles.summaryItem}>
                <span>{product.name} × {quantity}</span>
                <span>${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className={styles.summaryTotal}>
              <div className={styles.summaryItem}>
                <span>Total:</span>
                <span>${totalCartPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.checkoutActions}>
            <Button 
              onClick={handleCheckout}
              disabled={createOrderMutation.isPending || businessCartItems.length === 0}
              className={styles.checkoutButton}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Spinner size="sm" /> Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
            
            {createOrderMutation.isError && (
              <div className={styles.checkoutError}>
                <AlertCircle size={16} />
                {createOrderMutation.error?.message || "Failed to process order"}
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>


      {isFetching && products && (
        <div className={styles.refreshingIndicator}>
          <Spinner size="sm" />
          <span>Refreshing products...</span>
        </div>
      )}

      <div className={styles.productGrid}>
        {products?.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <img
              src={product.imageUrl || "https://via.placeholder.com/300"}
              alt={product.name}
              className={styles.productImage}
            />
            <div className={styles.productInfo}>
              <Badge variant="secondary" className={styles.productPrice}>
                ${product.price.toFixed(2)}
              </Badge>
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productDescription}>{product.description}</p>
              <Button 
                variant="ghost"
                onClick={() => handleAddToCart(product)} 
                className={styles.addButton}
              >
                {isMobile ? (
                  <ShoppingCart size={16} className={styles.cartIcon} />
                ) : (
                  <>
                    <ShoppingCart size={16} className={styles.cartIcon} /> Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {businessCartItems.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className={styles.floatingCartButton}>
              <ShoppingCart size={20} />
              View Cart ({totalQuantity})
            </Button>
          </DialogTrigger>
          <DialogContent className={styles.dialogContent}>
            <DialogHeader>
              <DialogTitle>Confirm Details</DialogTitle>
            </DialogHeader>
            {renderCartContent()}
          </DialogContent>
        </Dialog>
      )}

      {/* Business Information Popup */}
      {business && (
        <Dialog open={businessInfoOpen} onOpenChange={setBusinessInfoOpen}>
          <DialogContent className={styles.businessInfoDialog}>
            <DialogHeader>
              <DialogTitle className={styles.businessInfoTitle}>
                <Gift size={20} />
                Business Information
              </DialogTitle>
            </DialogHeader>
            
            <div className={styles.businessInfoContent}>
              <div className={styles.businessInfoSection}>
                <h3 className={styles.businessInfoName}>{business.name}</h3>
                {business.businessType && (
                  <span className={styles.businessInfoType}>{business.businessType}</span>
                )}
                <p className={styles.businessInfoAddress}>
                  <MapPin size={16} />
                  {business.address}
                </p>
                {business.description && (
                  <p className={styles.businessInfoDescription}>{business.description}</p>
                )}
              </div>
              
              <div className={styles.businessContactSection}>
                <h4 className={styles.contactSectionTitle}>Contact Details</h4>
                {business.phone && (
                  <div className={styles.contactInfoItem}>
                    <span className={styles.contactInfoLabel}>Phone:</span>
                    <span className={styles.contactInfoValue}>{business.phone}</span>
                  </div>
                )}
                {business.website && (
                  <div className={styles.contactInfoItem}>
                    <span className={styles.contactInfoLabel}>Website:</span>
                    <a 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactInfoWebsite}
                    >
                      {business.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};