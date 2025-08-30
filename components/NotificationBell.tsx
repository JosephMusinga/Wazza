import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { Button } from './Button';
import { Badge } from './Badge';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../helpers/useNotifications';
import { Bell } from 'lucide-react';
import styles from './NotificationBell.module.css';

export const NotificationBell = ({ className }: { className?: string }) => {
  const { unreadCount, isLoading } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`${styles.bellButton} ${className || ''}`}>
          <Bell size={20} />
          {!isLoading && unreadCount > 0 && (
            <Badge className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={12} align="end" removeBackgroundAndPadding>
        <NotificationCenter />
      </PopoverContent>
    </Popover>
  );
};