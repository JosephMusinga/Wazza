import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle, Gift, User, Phone, ShoppingCart, Hash, CreditCard } from 'lucide-react';

import { Input } from './Input';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { Badge } from './Badge';
import { useRedeemGift } from '../helpers/useRedeemGift';
import { schema as redeemSchema } from '../endpoints/orders/gift/redeem_POST.schema';
import styles from './BusinessRedeemGift.module.css';

type RedeemGiftFormValues = z.infer<typeof redeemSchema>;

export const BusinessRedeemGift = ({ className }: { className?: string }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<RedeemGiftFormValues>({
    resolver: zodResolver(redeemSchema),
  });

  const redeemGiftMutation = useRedeemGift({
    onSuccess: (data) => {
      console.log('Gift redeemed successfully:', data);
    },
    onError: (error) => {
      console.error('Gift redemption failed:', error);
    },
  });

  const handleRedeemGift = (data: RedeemGiftFormValues) => {
    redeemGiftMutation.mutate(data);
  };

  const handleReset = () => {
    redeemGiftMutation.reset();
    resetForm();
  };

  const redeemedOrder = redeemGiftMutation.data;
  const isRedeemed = redeemedOrder && !redeemGiftMutation.isError;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <Gift className={styles.headerIcon} />
        <h2 className={styles.title}>Redeem a Gift</h2>
        <p className={styles.description}>
          {!isRedeemed 
            ? "Enter the order ID and redemption code to redeem the gift order."
            : "Gift order has been successfully redeemed!"
          }
        </p>
      </div>

      {/* Redemption Form */}
      {!isRedeemed && (
        <form onSubmit={handleSubmit(handleRedeemGift)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="orderId" className={styles.label}>Order ID</label>
            <Input
              id="orderId"
              type="number"
              placeholder="Enter order ID"
              {...register('orderId', { valueAsNumber: true })}
              disabled={redeemGiftMutation.isPending}
            />
            {errors.orderId && <p className={styles.errorMessage}>{errors.orderId.message}</p>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="redemptionCode" className={styles.label}>Redemption Code</label>
            <Input
              id="redemptionCode"
              type="text"
              placeholder="Enter 8-character code"
              {...register('redemptionCode')}
              disabled={redeemGiftMutation.isPending}
            />
            {errors.redemptionCode && <p className={styles.errorMessage}>{errors.redemptionCode.message}</p>}
          </div>
          <Button type="submit" disabled={redeemGiftMutation.isPending} className={styles.redeemButton}>
            {redeemGiftMutation.isPending && <Spinner size="sm" />}
            Redeem Gift
          </Button>
        </form>
      )}

      {/* Error State */}
      {redeemGiftMutation.isError && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle />
          <p>{redeemGiftMutation.error.message}</p>
          <Button variant="link" onClick={handleReset} className={styles.tryAgainButton}>Try Again</Button>
        </div>
      )}

      {/* Success State */}
      {isRedeemed && (
        <div className={styles.detailsContainer}>
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle />
            <p>Gift Successfully Redeemed!</p>
          </div>

          <div className={styles.recipientInfo}>
            <h3 className={styles.sectionTitle}>Recipient Details</h3>
            <div className={styles.detailItem}>
              <User size={16} />
              <span>{redeemedOrder.recipientInfo.recipientName}</span>
            </div>
            <div className={styles.detailItem}>
              <Phone size={16} />
              <span>{redeemedOrder.recipientInfo.recipientPhone}</span>
            </div>
            <div className={styles.detailItem}>
              <CreditCard size={16} />
              <span>{redeemedOrder.recipientInfo.recipientNationalId}</span>
            </div>
          </div>

          <div className={styles.orderInfo}>
            <h3 className={styles.sectionTitle}>Order Details</h3>
            <div className={styles.detailItem}>
              <Hash size={16} />
              <span>Order #{redeemedOrder.id}</span>
              <Badge variant="success" className={styles.statusBadge}>
                Redeemed
              </Badge>
            </div>
            <div className={styles.detailItem}>
              <ShoppingCart size={16} />
              <span>Items</span>
            </div>
            <ul className={styles.itemList}>
              {redeemedOrder.items.map(item => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemName}>{item.product.name}</span>
                    <span className={styles.itemQuantity}>Qty: {item.quantity}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleReset}>
              Process Another Gift
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};