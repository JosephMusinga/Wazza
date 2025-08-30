import React, { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Order } from "../endpoints/business/orders_GET.schema";
import { OrderStatus, OrderStatusArrayValues } from "../helpers/schema";
import { useUpdateBusinessOrderStatus } from "../helpers/useBusinessOrders";
import { useRedeemGift } from '../helpers/useRedeemGift';
import { schema as redeemSchema } from '../endpoints/orders/gift/redeem_POST.schema';
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Input } from "./Input";
import { Spinner } from "./Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Separator } from "./Separator";
import {
  AlertTriangle,
  Calendar,
  Hash,
  User,
  ShoppingBag,
  DollarSign,
  Loader2,
  Gift,
  Phone,
  CheckCircle,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import styles from "./BusinessOrderDetail.module.css";

interface BusinessOrderDetailProps {
  order: Order;
  className?: string;
}

type RedeemGiftFormValues = z.infer<typeof redeemSchema>;

const getStatusVariant = (
  status: OrderStatus
): "success" | "warning" | "destructive" | "secondary" | "default" => {
  switch (status) {
    case "collected":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

export const BusinessOrderDetail = ({
  order,
  className,
}: BusinessOrderDetailProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);

  const updateStatusMutation = useUpdateBusinessOrderStatus();

  // Redemption form state
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<RedeemGiftFormValues>({
    resolver: zodResolver(redeemSchema),
  });

  const redeemGiftMutation = useRedeemGift({
    onSuccess: () => {
      // Data is now available in redeemGiftMutation.data
      console.log('Gift redemption verified successfully');
    },
    onError: (error) => {
      console.error('Gift redemption verification failed:', error);
    },
  });

  const handleStatusChangeRequest = (status: OrderStatus) => {
    if (status === order.status) return;
    setNewStatus(status);
    setIsDialogOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (!newStatus) return;
    updateStatusMutation.mutate(
      { orderId: order.id, status: newStatus },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setNewStatus(null);
        },
        onError: () => {
          // Dialog remains open on error to allow retry
        },
      }
    );
  };

  const handleVerifyCode = (data: RedeemGiftFormValues) => {
    redeemGiftMutation.mutate(data);
  };

  const handleMarkAsRedeemed = () => {
    if (redeemGiftMutation.data) {
      updateStatusMutation.mutate({
        orderId: redeemGiftMutation.data.id,
        status: 'collected',
      }, {
        onSuccess: () => {
          redeemGiftMutation.reset();
          resetForm();
        }
      });
    }
  };

  const handleResetRedemption = () => {
    redeemGiftMutation.reset();
    updateStatusMutation.reset();
    resetForm();
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(order.createdAt));

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency,
  }).format(order.totalAmount);

  const getStatusDisplayText = (status: OrderStatus) => {
    if (status === "collected" && order.isGift) {
      return "Gift Collected";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const verifiedOrder = redeemGiftMutation.data;
  const showRedemptionSection = order.isGift && order.status === 'pending';

  return (
    <>
      <article className={`${styles.container} ${className || ""}`}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <h2 className={styles.title}>Order Details</h2>
            <div className={styles.headerInfo}>
              <div className={styles.infoItem}>
                <Hash size={14} />
                <span>{order.id}</span>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={14} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {order.isGift && (
              <Badge variant="secondary" className={styles.giftBadge}>
                <Gift size={12} />
                Gift Order
              </Badge>
            )}
            <Badge variant={getStatusVariant(order.status)} className={styles.statusBadge}>
              {getStatusDisplayText(order.status)}
            </Badge>
            <Select
              value={order.status}
              onValueChange={(value) => handleStatusChangeRequest(value as OrderStatus)}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className={styles.statusSelect}>
                <SelectValue>Update Status</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {OrderStatusArrayValues.map((s) => (
                  <SelectItem key={s} value={s} disabled={s === order.status}>
                    {s === "collected" && order.isGift ? "Gift Collected" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <Separator />

        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <section className={styles.orderInfoSection}>
              <h3 className={styles.sectionTitle}>
                <Hash size={18} />
                <span>Order Information</span>
              </h3>
              <p className={styles.orderNumber}>Order #{order.id}</p>
              <p className={styles.orderDate}>
                Created: {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(order.createdAt))}
              </p>
              {order.isGift && (
                <div className={styles.giftIndicator}>
                  <Gift size={16} />
                  <span>This is a gift order</span>
                </div>
              )}
            </section>

            {showRedemptionSection && (
              <section className={styles.redemptionSection}>
                <h3 className={styles.sectionTitle}>
                  <Gift size={18} />
                  <span>Redeem Gift</span>
                </h3>
                
                {!verifiedOrder && (
                  <div className={styles.redemptionForm}>
                    <p className={styles.redemptionDescription}>
                      Enter the recipient's redemption code to verify and complete the gift order.
                    </p>
                    
                    <form onSubmit={handleSubmit(handleVerifyCode)} className={styles.form}>
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
                      <Button type="submit" disabled={redeemGiftMutation.isPending} className={styles.verifyButton}>
                        {redeemGiftMutation.isPending && <Spinner size="sm" />}
                        Verify Code
                      </Button>
                    </form>
                  </div>
                )}

                {redeemGiftMutation.isError && (
                  <div className={`${styles.alert} ${styles.alertError}`}>
                    <AlertCircle />
                    <p>{redeemGiftMutation.error.message}</p>
                    <Button variant="link" onClick={handleResetRedemption} className={styles.tryAgainButton}>Try Again</Button>
                  </div>
                )}

                {verifiedOrder && (
                  <div className={styles.redemptionDetails}>
                    <div className={`${styles.alert} ${styles.alertSuccess}`}>
                      <CheckCircle />
                      <p>Verification Successful! Please confirm details with the recipient.</p>
                    </div>

                    <div className={styles.recipientInfo}>
                      <h4 className={styles.subsectionTitle}>Recipient Details</h4>
                      <div className={styles.detailItem}>
                        <User size={16} />
                        <span>{verifiedOrder.recipientInfo.recipientName}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <Phone size={16} />
                        <span>{verifiedOrder.recipientInfo.recipientPhone}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <CreditCard size={16} />
                        <span>{verifiedOrder.recipientInfo.recipientNationalId}</span>
                      </div>
                    </div>

                    <div className={styles.redemptionActions}>
                      <Button variant="outline" onClick={handleResetRedemption} disabled={updateStatusMutation.isPending}>
                        Cancel
                      </Button>
                      <Button onClick={handleMarkAsRedeemed} disabled={updateStatusMutation.isPending}>
                        {updateStatusMutation.isPending && <Spinner size="sm" />}
                        Mark as Collected
                      </Button>
                    </div>
                    {updateStatusMutation.isError && (
                      <div className={`${styles.alert} ${styles.alertError} ${styles.redeemError}`}>
                        <AlertCircle />
                        <p>{updateStatusMutation.error.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          <section className={styles.summarySection}>
            <h3 className={styles.sectionTitle}>
              <ShoppingBag size={18} />
              <span>Order Summary</span>
            </h3>
            <ul className={styles.itemList}>
              {order.items.map((item: Order['items'][0]) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemQuantity}>{item.quantity}x</span>
                    <span className={styles.itemName}>{item.product.name}</span>
                  </div>
                  <div className={styles.itemPricing}>
                    <span className={styles.itemUnitPrice}>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: order.currency,
                      }).format(item.unitPrice)}{" "}
                      each
                    </span>
                    <span className={styles.itemTotalPrice}>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: order.currency,
                      }).format(item.totalPrice)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <Separator className={styles.summarySeparator} />
            <div className={styles.totalContainer}>
              <div className={styles.totalLabel}>
                <DollarSign size={20} />
                <span>Total</span>
              </div>
              <div className={styles.totalAmount}>{formattedTotal}</div>
            </div>
          </section>
        </div>
      </article>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={styles.dialogTitle}>
              <AlertTriangle className={styles.dialogIcon} />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to change the order status from{" "}
              <strong>{getStatusDisplayText(order.status)}</strong> to{" "}
              <strong>{newStatus === "collected" && order.isGift ? "Gift Collected" : newStatus ? newStatus.charAt(0).toUpperCase() + newStatus.slice(1) : ""}</strong>?
              {order.isGift && newStatus === "collected" && " This will mark the gift as successfully collected by the recipient."}
              {!order.isGift && " This action may notify the customer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={updateStatusMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 size={16} className={styles.spinner} />
              )}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};