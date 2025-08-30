import React from "react";
import { Skeleton } from "./Skeleton";
import styles from "./BusinessOrderListSkeleton.module.css";

interface BusinessOrderListSkeletonProps {
  count?: number;
  className?: string;
}

export const BusinessOrderListSkeleton = ({
  count = 3,
  className,
}: BusinessOrderListSkeletonProps) => {
  return (
    <div className={`${styles.container} ${className || ""}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.header}>
            <Skeleton style={{ width: "120px", height: "20px" }} />
            <Skeleton style={{ width: "80px", height: "24px" }} />
          </div>
          <div className={styles.body}>
            <div className={styles.leftCol}>
              <Skeleton style={{ width: "150px", height: "20px", marginBottom: 'var(--spacing-3)' }} />
              <Skeleton style={{ width: "100px", height: "16px" }} />
              <Skeleton style={{ width: "180px", height: "16px", marginTop: 'var(--spacing-1)' }} />
            </div>
            <div className={styles.rightCol}>
              <Skeleton style={{ width: "120px", height: "20px", marginBottom: 'var(--spacing-3)' }} />
              <Skeleton style={{ width: "100%", height: "16px" }} />
              <Skeleton style={{ width: "80%", height: "16px", marginTop: 'var(--spacing-2)' }} />
              <Skeleton style={{ width: "90%", height: "16px", marginTop: 'var(--spacing-2)' }} />
            </div>
          </div>
          <div className={styles.footer}>
            <Skeleton style={{ width: "150px", height: "24px" }} />
            <Skeleton style={{ width: "160px", height: "36px" }} />
          </div>
        </div>
      ))}
    </div>
  );
};