import React from 'react';
import { useBusinessOrders, useUpdateBusinessOrderStatus } from '../helpers/useBusinessOrders';
import { Order } from '../endpoints/business/orders_GET.schema';
import { OrderStatus } from '../helpers/schema';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { AlertTriangle, Inbox, PackageCheck, Package, Hash, ShoppingBag } from 'lucide-react';
import styles from './BusinessOwnerPendingOrders.module.css';

const PendingGiftOrderCard = ({ order }: { order: Order }) => {
  const updateStatusMutation = useUpdateBusinessOrderStatus();

  const handleMarkAsReady = () => {
    updateStatusMutation.mutate({ orderId: order.id, status: 'collected' });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.orderId}>
          <Package size={18} />
          <span>Order #{order.id}</span>
        </div>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.sectionTitle}>
          <ShoppingBag size={16} />
          <span>Order Items</span>
        </h3>
        <ul className={styles.itemList}>
          {order.items.map(item => (
            <li key={item.id} className={styles.item}>
              <span className={styles.itemQuantity}>{item.quantity}x</span>
              <span className={styles.itemName}>{item.product.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.cardFooter}>
        <Button 
          onClick={handleMarkAsReady} 
          disabled={updateStatusMutation.isPending}
          size="sm"
        >
          <PackageCheck size={16} />
          {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Collected'}
        </Button>
      </div>
    </div>
  );
};

const PendingOrdersSkeleton = () => {
  return (
    <div className={styles.ordersGrid}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardHeader}>
            <Skeleton style={{ height: '24px', width: '120px' }} />
          </div>
          <div className={styles.cardBody}>
            <Skeleton style={{ height: '20px', width: '150px', marginBottom: 'var(--spacing-3)' }} />
            <div className={styles.itemList}>
              <Skeleton style={{ height: '20px', width: '80%' }} />
              <Skeleton style={{ height: '20px', width: '60%' }} />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <Skeleton style={{ height: '32px', width: '200px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const BusinessOwnerPendingOrders = ({ className }: { className?: string }) => {
  const { data, isFetching, isError, error, refetch } = useBusinessOrders({
    page: 1,
    status: 'pending',
    isGift: true,
    limit: 100, // Fetch all pending gift orders
    sortBy: 'createdAt',
    sortOrder: 'asc',
  });

  const renderContent = () => {
    if (isFetching) {
      return <PendingOrdersSkeleton />;
    }

    if (isError) {
      return (
        <div className={styles.stateContainer}>
          <AlertTriangle className={styles.stateIconError} />
          <p className={styles.stateMessage}>
            {error instanceof Error ? error.message : 'Failed to load pending orders.'}
          </p>
          <Button onClick={() => refetch()} variant="outline">Try Again</Button>
        </div>
      );
    }

    if (!data || data.orders.length === 0) {
      return (
        <div className={styles.stateContainer}>
          <Inbox className={styles.stateIcon} />
          <h3 className={styles.stateTitle}>No Pending Gift Orders</h3>
          <p className={styles.stateMessage}>
            You're all caught up! New pending gift orders will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className={styles.ordersGrid}>
        {data.orders.map(order => (
          <PendingGiftOrderCard key={order.id} order={order} />
        ))}
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>Pending Gift Orders</h2>
        <p className={styles.subtitle}>
          These gift orders are awaiting preparation for pickup.
        </p>
      </header>
      {renderContent()}
    </div>
  );
};