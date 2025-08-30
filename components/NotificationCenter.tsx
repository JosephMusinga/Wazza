import React, { useRef, useCallback, useEffect } from 'react';
import { useNotifications } from '../helpers/useNotifications';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { Separator } from './Separator';
import { Badge } from './Badge';
import { Bell, Check, Mail, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import styles from './NotificationCenter.module.css';
import { Notification } from '../endpoints/notifications_GET.schema';

const NOTIFICATION_ICONS: Record<Notification['type'], React.ElementType> = {
  new_order: ShoppingCart,
  order_status_change: Package,
  order_completed: Check,
  order_cancelled: AlertTriangle,
  business_approved: Check,
  business_rejected: AlertTriangle,
  system_announcement: Mail,
};

const NotificationItem = ({ notification, onMarkAsRead }: { notification: Notification, onMarkAsRead: (id: number) => void }) => {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const isRead = !!notification.readAt;

  return (
    <div className={`${styles.notificationItem} ${isRead ? styles.read : ''}`}>
      {!isRead && <div className={styles.unreadIndicator} />}
      <div className={styles.iconWrapper}>
        <Icon size={20} />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.message}>{notification.message}</p>
        <p className={styles.time}>{new Date(notification.sentAt).toLocaleString()}</p>
      </div>
      {!isRead && (
        <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
          Mark as read
        </Button>
      )}
    </div>
  );
};

const NotificationSkeleton = () => (
  <div className={styles.notificationItem}>
    <div className={styles.iconWrapper}>
      <Skeleton style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
    </div>
    <div className={styles.content}>
      <Skeleton style={{ width: '80%', height: '1rem', marginBottom: 'var(--spacing-1)' }} />
      <Skeleton style={{ width: '100%', height: '0.875rem' }} />
      <Skeleton style={{ width: '50%', height: '0.75rem', marginTop: 'var(--spacing-1)' }} />
    </div>
  </div>
);

export const NotificationCenter = ({ className }: { className?: string }) => {
  const {
    notifications,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    markOneAsRead,
    markAllAsRead,
    isMarkingAsRead,
    unreadCount,
  } = useNotifications();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Notifications</h2>
          {unreadCount > 0 && <Badge variant="default">{unreadCount} New</Badge>}
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={markAllAsRead}
          disabled={isMarkingAsRead || unreadCount === 0}
        >
          Mark all as read
        </Button>
      </header>
      <Separator />
      <div className={styles.notificationList}>
        {isLoading && !notifications.length ? (
          Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)
        ) : error ? (
          <div className={styles.emptyState}>
            <p>Error loading notifications.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <p>You have no notifications.</p>
          </div>
        ) : (
          <>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                ref={index === notifications.length - 1 ? lastElementRef : null}
              >
                <NotificationItem notification={notification} onMarkAsRead={markOneAsRead} />
              </div>
            ))}
            {isFetchingNextPage && <NotificationSkeleton />}
          </>
        )}
      </div>
    </div>
  );
};