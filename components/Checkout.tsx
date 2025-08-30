import React from 'react';
import { useCreateOrder } from '../helpers/useCreateOrder';
import { useCreateGiftOrder } from '../helpers/useCreateGiftOrder';
import { useShoppingCart, CartItem } from '../helpers/useShoppingCart';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { toast } from 'sonner';
import { ShoppingBag, AlertCircle, Gift, User, MessageCircle, CheckCircle } from 'lucide-react';
import styles from './Checkout.module.css';

export type PurchaseType = 'self' | 'recipient';

export interface RecipientInfo {
  name: string;
  phone: string;
  nationalId: string;
}

export interface CheckoutProps {
  /** The ID of the business the order is for. */
  businessId: number;
  /** The items in the cart for this specific business. */
  cartItems: Record<string, CartItem>;
  /** Type of purchase - for self or for a recipient */
  purchaseType: PurchaseType;
  /** Recipient information (required when purchaseType is 'recipient') */
  recipientInfo?: RecipientInfo;
  /** Callback function to execute on successful order creation. e.g. for navigation. */
  onSuccess: (orderId: number, code: string) => void;
  /** Optional className to apply to the container. */
  className?: string;
}

export const Checkout: React.FC<CheckoutProps> = ({ 
  businessId, 
  cartItems, 
  purchaseType, 
  recipientInfo, 
  onSuccess, 
  className 
}) => {
  const { clearCart } = useShoppingCart();
  const createOrderMutation = useCreateOrder();
  const createGiftOrderMutation = useCreateGiftOrder();

  const itemsArray = Object.values(cartItems);
  const totalItems = itemsArray.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = itemsArray.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const isGiftPurchase = purchaseType === 'recipient';
  const activeMutation = isGiftPurchase ? createGiftOrderMutation : createOrderMutation;




  const handlePlaceOrder = async () => {
    const orderItems = itemsArray.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    if (isGiftPurchase) {
      if (!recipientInfo) {
        toast.error('Recipient information is required for gift orders.');
        return;
      }

      createGiftOrderMutation.mutate(
        {
          businessId,
          items: orderItems,
            recipientName: recipientInfo.name,
            recipientPhone: recipientInfo.phone,
            recipientNationalId: recipientInfo.nationalId,
        },
        {
          onSuccess: (data) => {
            // Check SMS status from the backend response
            if (data.smsStatus === 'sent') {
              toast.success(
                <div>
                  <div><strong>Gift sent successfully!</strong></div>
                  <div>SMS with redemption code sent to {recipientInfo.name}</div>
                </div>
              );
            } else {
              toast.warning(
                <div>
                  <div><strong>Gift order placed successfully!</strong></div>
                  <div>However, SMS delivery failed. Please contact the recipient directly.</div>
                  <div>Redemption code: <strong>{data.redemptionCode}</strong></div>
                </div>
              );
            }
            
            clearCart();
            onSuccess(data.id, data.redemptionCode);
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to place gift order.');
          },
        }
      );
    } else {
      // Self purchase
      createOrderMutation.mutate(
        {
          businessId,
          items: orderItems,
          shippingAddress: 'In-store pickup',
        },
        {
          onSuccess: (data) => {
            toast.success(
              <div>
                <div><strong>Order #{data.id} placed successfully!</strong></div>
                <div>Redemption Code: <strong>{data.redemptionCode}</strong></div>
              </div>
            );
            clearCart();
            onSuccess(data.id, data.redemptionCode || '');
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to place order.');
          },
        }
      );
    }
  };

  if (itemsArray.length === 0) {
    return (
      <div className={`${styles.checkoutContainer} ${styles.emptyState} ${className || ''}`}>
        <ShoppingBag size={48} className={styles.emptyIcon} />
        <h3>Your cart is empty</h3>
        <p>Add some products to your cart before checking out.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.checkoutContainer} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.purchaseTypeIcon}>
          {isGiftPurchase ? <Gift size={24} /> : <User size={24} />}
        </div>
        <h2 className={styles.title}>
          {isGiftPurchase ? 'Gift Order Checkout' : 'Checkout'}
        </h2>
      </div>
      
      {isGiftPurchase && recipientInfo && (
        <div className={styles.recipientInfo}>
          <h3 className={styles.sectionTitle}>Gift Recipient</h3>
          <div className={styles.recipientDetails}>
            <div className={styles.recipientRow}>
              <span>Name:</span>
              <span>{recipientInfo.name}</span>
            </div>
            <div className={styles.recipientRow}>
              <span>Phone:</span>
              <span>{recipientInfo.phone}</span>
            </div>
            <div className={styles.recipientRow}>
              <span>National ID:</span>
              <span>{recipientInfo.nationalId}</span>
            </div>
          </div>
          <div className={styles.smsInfo}>
            <MessageCircle size={16} />
            <span>Redemption code will be sent via SMS to the recipient</span>
          </div>
        </div>
      )}
      
      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>Order Summary</h3>
        <div className={styles.summaryRow}>
          <span>Total Items:</span>
          <span>{totalItems}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Total Price:</span>
          <span className={styles.totalPrice}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice)}
          </span>
        </div>
        <div className={styles.pickupInfo}>
          {isGiftPurchase ? (
          <p>This is a gift order. The recipient will receive a redemption code and can collect their items using their national ID.</p>
          ) : (
            <p>This order is for in-store pickup. You will receive a pickup code after placing your order.</p>
          )}
        </div>
      </div>

      {activeMutation.isError && (
         <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{activeMutation.error?.message}</span>
        </div>
      )}

      <Button 
        onClick={handlePlaceOrder}
        className={styles.submitButton} 
        disabled={activeMutation.isPending}
        size="lg"
      >
        {activeMutation.isPending ? (
          <>
            <Spinner size="sm" />
            {isGiftPurchase ? 'Placing Gift Order...' : 'Placing Order...'}
          </>
        ) : (
          <>
            {isGiftPurchase ? <Gift size={20} /> : <CheckCircle size={20} />}
            {isGiftPurchase ? 'Send Gift Order' : 'Place Order'}
          </>
        )}
      </Button>
    </div>
  );
};