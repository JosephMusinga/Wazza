import React, { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown, Package, AlertCircle, ShoppingCart, Gift, Copy, Check } from "lucide-react";
import { useUserOrders } from "../helpers/useUserOrders";
import { Order } from "../endpoints/orders_GET.schema";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Button } from "./Button";
import styles from "./UserOrderTracking.module.css";

const OrderStatusBadge: React.FC<{ status: Order['status']; isGift: boolean }> = ({ status, isGift }) => {
  const getVariant = () => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'collected':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = () => {
    if (isGift && status === 'pending') {
      return 'Ready for pickup';
    }
    
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'collected':
        return 'Collected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant()}>
      {getStatusText()}
    </Badge>
  );
};

const RedemptionCodeDisplay: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy secret code:', err);
    }
  };

  return (
    <div className={styles.redemptionCode}>
      <div className={styles.codeLabel}>Secret Code:</div>
      <div className={styles.codeContainer}>
        <code className={styles.code}>{code}</code>
        <Button 
          variant="ghost" 
          size="icon-sm" 
          onClick={handleCopy}
          className={styles.copyButton}
          title="Copy secret code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </Button>
      </div>
    </div>
  );
};

const OrderItem: React.FC<{ item: Order['items'][0] }> = ({ item }) => (
  <div className={styles.orderItem}>
    <img src={item.product.imageUrl || '/placeholder.svg'} alt={item.product.name} className={styles.productImage} />
    <div className={styles.itemDetails}>
      <p className={styles.productName}>{item.product.name}</p>
      <p className={styles.itemMeta}>
        {item.quantity} x ${item.unitPrice.toFixed(2)}
      </p>
    </div>
    <p className={styles.itemTotal}>${item.totalPrice.toFixed(2)}</p>
  </div>
);

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Check if this is a gift order using the isGift field from the order schema
  const isGift = order.isGift;
  const redemptionCode = (order as any).redemptionCode;
  const recipientName = order.recipientName;
  const recipientPhone = (order as any).recipientPhone;
  const recipientNationalId = (order as any).recipientNationalId;

  return (
    <Collapsible.Root className={styles.orderCard} open={isOpen} onOpenChange={setIsOpen}>
      <div className={styles.orderHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.orderId}>
            {isGift ? <Gift size={18} /> : <Package size={18} />}
            <span>Order #{order.id}</span>
            {isGift && <Badge variant="secondary" className={styles.giftBadge}>Gift</Badge>}
          </div>
          <div className={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className={styles.headerStatus}>
          <OrderStatusBadge status={order.status} isGift={isGift} />
        </div>
        <div className={styles.headerTotal}>
          ${order.totalAmount.toFixed(2)}
        </div>
        <Collapsible.Trigger asChild>
          <Button variant="ghost" size="icon-sm" className={styles.chevron}>
            <ChevronDown size={16} />
          </Button>
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content className={styles.collapsibleContent}>
        <div className={styles.orderDetails}>
          <div className={styles.businessInfo}>
            Sold by: <strong>{order.business.name}</strong>
          </div>
          
          {isGift && recipientName && (
            <div className={styles.giftInfo}>
              <div className={styles.recipientInfo}>
                <strong>Gift for:</strong> {recipientName}
              </div>
              {recipientPhone && (
                <div className={styles.recipientDetail}>
                  <strong>Phone:</strong> {recipientPhone}
                </div>
              )}
              {recipientNationalId && (
                <div className={styles.recipientDetail}>
                  <strong>National ID:</strong> {recipientNationalId}
                </div>
              )}
            </div>
          )}
          
          {redemptionCode && (
            <RedemptionCodeDisplay code={redemptionCode} />
          )}
          
          <div className={styles.itemsHeader}>
            {totalItems} item{totalItems > 1 ? 's' : ''}
          </div>
          <div className={styles.itemsList}>
            {order.items.map(item => <OrderItem key={item.id} item={item} />)}
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

const LoadingSkeleton = () => (
  <div className={styles.skeletonContainer}>
    {[...Array(3)].map((_, i) => (
      <div key={i} className={styles.skeletonCard}>
        <div className={styles.skeletonHeader}>
          <Skeleton style={{ height: '1.5rem', width: '120px' }} />
          <Skeleton style={{ height: '1.5rem', width: '180px' }} />
        </div>
        <div className={styles.skeletonRight}>
          <Skeleton style={{ height: '2rem', width: '80px' }} />
          <Skeleton style={{ height: '2rem', width: '100px' }} />
        </div>
      </div>
    ))}
  </div>
);

export const UserOrderTracking: React.FC<{ className?: string }> = ({ className }) => {
  const [page, setPage] = useState(1);
  const { data, isFetching, isError, error } = useUserOrders({ page, limit: 10 });

  if (isFetching && !data) {
    return <div className={`${styles.container} ${className || ''}`}><LoadingSkeleton /></div>;
  }

  if (isError) {
    return (
      <div className={`${styles.container} ${styles.centered} ${className || ''}`}>
        <AlertCircle className={styles.errorIcon} />
        <h3 className={styles.errorTitle}>Failed to load orders</h3>
        <p className={styles.errorMessage}>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <div className={`${styles.container} ${styles.centered} ${className || ''}`}>
        <ShoppingCart className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>No orders yet</h3>
        <p className={styles.emptyMessage}>You haven't placed any orders. Start shopping to see your history here.</p>
      </div>
    );
  }

  const { orders, total, limit } = data;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.ordersList}>
        {orders.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isFetching}>
            Previous
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || isFetching}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};