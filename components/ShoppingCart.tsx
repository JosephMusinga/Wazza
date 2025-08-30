import React, { useState, useMemo, useCallback } from "react";
import { useShoppingCart, CartItem } from "../helpers/useShoppingCart";
import { Business } from "../endpoints/businesses_GET.schema";
import { useCreateOrder } from "../helpers/useCreateOrder";
import { UserGiftPurchase } from "./UserGiftPurchase";
import { Button } from "./Button";
import { Input } from "./Input";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import { useIsMobile } from "../helpers/useIsMobile";
import {
  ShoppingCart as ShoppingCartIcon,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  PackageCheck,
  X,
  User,
  Gift,
  ArrowLeft,
  Copy,
} from "lucide-react";
import styles from "./ShoppingCart.module.css";

interface ShoppingCartProps {
  className?: string;
  selectedBusiness?: Business | null;
}

type PurchaseType = "selection" | "receipt" | "self" | "gift";

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ className, selectedBusiness }) => {
  const { items, updateQuantity, removeItem, totalItems, totalPrice, cartForBusiness } = useShoppingCart();
  const createOrderMutation = useCreateOrder();


  const [purchaseType, setPurchaseType] = useState<PurchaseType>("selection");
  const [pickupCode, setPickupCode] = useState<string>("");

  const cartItems = useMemo(() => {
    if (selectedBusiness) {
      return Object.values(cartForBusiness(selectedBusiness.id));
    }
    return Object.values(items);
  }, [items, selectedBusiness, cartForBusiness]);

  const generatePickupCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Pickup code copied to clipboard");
    });
  }, []);

  const businessGroups = useMemo(() => {
    const groups: Record<
      string,
      { businessId: number; businessName: string; items: CartItem[] }
    > = {};

    for (const item of cartItems) {
      const { businessId } = item.product;
      if (!groups[businessId]) {
        groups[businessId] = {
          businessId,
          businessName: selectedBusiness?.name || `Business #${businessId}`,
          items: [],
        };
      }
      groups[businessId].items.push(item);
    }
    return Object.values(groups);
  }, [cartItems, selectedBusiness]);

  const handleCheckout = useCallback(
    (businessId: number, itemsToCheckout: CartItem[]) => {
      if (itemsToCheckout.length === 0) return;

      const orderItems = itemsToCheckout.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      createOrderMutation.mutate(
        {
          businessId,
          items: orderItems,
          shippingAddress: "In-store pickup",
        },
        {
          onSuccess: () => {
            orderItems.forEach((item) => updateQuantity(item.productId, 0));
            const newPickupCode = generatePickupCode();
            setPickupCode(newPickupCode);
            setPurchaseType("self");
          },
        }
      );
    },
    [createOrderMutation, updateQuantity]
  );

  const handleGiftComplete = () => {
    // Clear the cart items that were used for the gift
    if (selectedBusiness) {
      // Only clear items for the selected business
      cartItems.forEach(item => updateQuantity(item.product.id, 0));
    } else {
      // Clear all cart items if no specific business is selected
      cartItems.forEach(item => updateQuantity(item.product.id, 0));
    }
    setPurchaseType("selection");
    console.log('Gift purchase completed, cart cleared');
  };

  const renderCartContent = () => {
    const displayTotalItems = selectedBusiness 
      ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
      : totalItems;
    const displayTotalPrice = selectedBusiness
      ? cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      : totalPrice;

    if (displayTotalItems === 0) {
      return (
        <div className={styles.emptyState}>
          <ShoppingCartIcon size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Your cart is empty</h3>
          <p className={styles.emptyMessage}>
            Add some products to get started.
          </p>
        </div>
      );
    }

    if (createOrderMutation.isSuccess && (purchaseType === "self" || purchaseType === "receipt")) {
      return (
        <div className={styles.successState}>
          <PackageCheck size={64} className={styles.successIcon} />
          <h3 className={styles.successTitle}>Order Placed!</h3>
          <p className={styles.successMessage}>
            Present this pickup code at the business to collect your order.
          </p>
          <div className={styles.pickupCodeWrapper}>
            <span className={styles.pickupCode}>{pickupCode}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => copyToClipboard(pickupCode)}
              aria-label="Copy pickup code"
            >
              <Copy size={20} />
            </Button>
          </div>
          <Button onClick={() => {
            createOrderMutation.reset();
            setPurchaseType("selection");
            setPickupCode("");
          }}>
            Continue Shopping
          </Button>
        </div>
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
            {businessGroups.map(({ businessId, businessName, items }) => (
              <div key={businessId} className={styles.businessOrderSection}>
                <div className={styles.businessOrderName}>{businessName}</div>
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className={styles.summaryItem}>
                    <span>{product.name} × {quantity}</span>
                    <span>${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className={styles.summaryTotal}>
              <div className={styles.summaryItem}>
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.checkoutActions}>
            <Button 
              onClick={() => {
                businessGroups.forEach(({ businessId, items }) => {
                  handleCheckout(businessId, items);
                });
              }}
              disabled={createOrderMutation.isPending || businessGroups.length === 0}
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

    if (purchaseType === "gift") {
      return (
        <div className={styles.giftPurchaseContainer}>
          <div className={styles.giftHeader}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setPurchaseType("selection")}
              className={styles.backButton}
            >
              <ArrowLeft size={20} />
            </Button>
            <h3>Send as Gift</h3>
          </div>
          <UserGiftPurchase 
            preselectedBusinessId={businessGroups[0]?.businessId}
            useCartItems={true}
            className={styles.embeddedGiftPurchase}
            onComplete={handleGiftComplete}
          />
        </div>
      );
    }



    // Default selection view
    return (
      <>
        <div className={styles.cartItemsList}>
          {businessGroups.map(({ businessId, businessName, items }) => (
            <div key={businessId} className={styles.businessGroup}>
              {items.map(({ product, quantity }) => {
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
                        <span className={styles.cartItemPrice}>
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className={styles.removeItemButton}
                      onClick={() => removeItem(product.id)}
                      aria-label={`Remove ${product.name} from cart`}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.cartSummary}>
          <div className={styles.totalPrice}>
            <span>Total:</span>
            <span>${displayTotalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.purchaseOptions}>
          <h4 className={styles.purchaseOptionsTitle}>How would you like to purchase?</h4>
          <div className={styles.purchaseOptionButtons}>
            <Button 
              variant="outline" 
              onClick={() => setPurchaseType("receipt")}
              disabled={businessGroups.length === 0}
              className={styles.purchaseOption}
            >
              <User size={20} />
              <div className={styles.purchaseOptionText}>
                <span className={styles.purchaseOptionTitle}>Buy for Myself</span>
                <span className={styles.purchaseOptionDesc}>Get pickup code after checkout</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setPurchaseType("gift")}
              className={styles.purchaseOption}
            >
              <Gift size={20} />
              <div className={styles.purchaseOptionText}>
                <span className={styles.purchaseOptionTitle}>Send as Gift</span>
                <span className={styles.purchaseOptionDesc}>Purchase for another recipient</span>
              </div>
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {selectedBusiness ? `${selectedBusiness.name} - Cart` : 'Shopping Cart'}
        </h2>
        <Badge variant="outline">
          {selectedBusiness 
            ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
            : totalItems
          } items
        </Badge>
      </header>
      <div className={styles.content}>{renderCartContent()}</div>
    </div>
  );
};