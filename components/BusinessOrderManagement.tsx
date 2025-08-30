import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBusinessOrders, BUSINESS_ORDERS_QUERY_KEY } from "../helpers/useBusinessOrders";
import { OrderStatusArrayValues } from "../helpers/schema";
import { Order } from "../endpoints/business/orders_GET.schema";
import { Button } from "./Button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./Dialog";
import { Spinner } from "./Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "./Pagination";

import { BusinessOrderCard } from "./BusinessOrderCard";
import { BusinessOrderListSkeleton } from "./BusinessOrderListSkeleton";
import { AlertTriangle, Inbox, Package, User, Hash, DollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import styles from "./BusinessOrderManagement.module.css";

const ORDERS_PER_PAGE = 5;

export const BusinessOrderManagement = ({
  className,
}: {
  className?: string;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [validatedOrderData, setValidatedOrderData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const queryClient = useQueryClient();


  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") || "all";
  const giftFilter = searchParams.get("giftFilter") || "all";
  const sortBy =
    (searchParams.get("sortBy") as "createdAt" | "totalAmount") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const setFilter = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      if (value === null || value === "all") {
        prev.delete(key);
      } else {
        prev.set(key, value);
      }
      // Reset to first page when filters change
      if (key !== "page") {
        prev.set("page", "1");
      }
      return prev;
    });
  };

  const { data, isFetching, isError, error, refetch } = useBusinessOrders({
    page,
    limit: ORDERS_PER_PAGE,
    status: status === "all" ? undefined : (status as any),
    sortBy,
    sortOrder,
    ...(giftFilter !== "all" && { isGift: giftFilter === "gift" }),
  });

  const handleRedeemSuccess = (order: Order) => {
    // Invalidate queries after successful redemption
    queryClient.invalidateQueries({ queryKey: [BUSINESS_ORDERS_QUERY_KEY] });
  };

  const handleRedemptionValidated = (validatedData: any) => {
    setValidatedOrderData(validatedData);
    setShowSuccessModal(true);
  };



  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setValidatedOrderData(null);
  };

  const totalPages = data ? Math.ceil(data.total / ORDERS_PER_PAGE) : 0;

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    const ellipsis = <PaginationEllipsis key="ellipsis" />;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (page > 3) pageNumbers.push(-1); // Ellipsis placeholder

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page === 1) end = 3;
      if (page === totalPages) start = totalPages - 2;

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (page < totalPages - 2) pageNumbers.push(-1); // Ellipsis placeholder
      pageNumbers.push(totalPages);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setFilter("page", (page - 1).toString())}
              aria-disabled={page <= 1}
              className={page <= 1 ? styles.disabledLink : ""}
            />
          </PaginationItem>
          {pageNumbers.map((p, index) =>
            p === -1 ? (
              <PaginationItem key={`ellipsis-${index}`}>
                {ellipsis}
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={page === p}
                  onClick={() => setFilter("page", p.toString())}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setFilter("page", (page + 1).toString())}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? styles.disabledLink : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderOrdersList = () => {
    if (isFetching && !data) {
      return <BusinessOrderListSkeleton count={ORDERS_PER_PAGE} />;
    }

    if (isError) {
      return (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p className={styles.errorMessage}>
            {error instanceof Error
              ? error.message
              : "Failed to load orders."}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      );
    }

    if (data && data.orders.length > 0) {
      return (
        <div className={styles.ordersGrid}>
          {data.orders.map((order) => (
            <BusinessOrderCard 
              key={order.id} 
              order={order} 
              onRedeemSuccess={handleRedeemSuccess}
              onRedemptionValidated={handleRedemptionValidated}
            />
          ))}
        </div>
      );
    }

    return (
      <div className={styles.emptyState}>
        <Inbox className={styles.emptyIcon} />
        <p className={styles.emptyMessage}>No orders found.</p>
        {(status !== "all" || giftFilter !== "all") && (
          <Button variant="link" onClick={() => {
            setFilter("status", "all");
            setFilter("giftFilter", "all");
          }}>
            Show all orders
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Order Management</h1>
          <div className={styles.filters}>
            <Select
              value={status}
              onValueChange={(value) => setFilter("status", value)}
            >
              <SelectTrigger className={styles.filterSelect}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={giftFilter}
              onValueChange={(value) => setFilter("giftFilter", value)}
            >
              <SelectTrigger className={styles.filterSelect}>
                <SelectValue placeholder="Filter by order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="gift">Gift Orders</SelectItem>
                <SelectItem value="regular">Regular Orders</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split("-");
                setFilter("sortBy", newSortBy);
                setFilter("sortOrder", newSortOrder);
              }}
            >
              <SelectTrigger className={styles.filterSelect}>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="totalAmount-desc">Amount (High-Low)</SelectItem>
                <SelectItem value="totalAmount-asc">Amount (Low-High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.ordersList}>
            <div className={styles.ordersListContent}>
              {renderOrdersList()}
            </div>
            {data && data.total > 0 && (
              <div className={styles.ordersListFooter}>
                {renderPagination()}
              </div>
            )}
          </div>
        </div>

        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className={styles.successModal}>
            <DialogHeader>
              <DialogTitle>Gift Code Validated Successfully!</DialogTitle>
              <DialogDescription>
                The verification code has been validated. Review the order details below and mark as collected when the customer picks up their order.
              </DialogDescription>
            </DialogHeader>

            {validatedOrderData && (
              <div className={styles.modalContent}>
                <div className={styles.orderInfo}>
                  <div className={styles.infoRow}>
                    <Hash size={16} />
                    <span className={styles.infoLabel}>Order ID:</span>
                    <span className={styles.infoValue}>#{validatedOrderData.id}</span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <DollarSign size={16} />
                    <span className={styles.infoLabel}>Total Amount:</span>
                    <span className={styles.infoValue}>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: validatedOrderData.currency,
                      }).format(validatedOrderData.totalAmount)}
                    </span>
                  </div>
                </div>

                {validatedOrderData.isGift ? (
                  <div className={styles.recipientInfo}>
                    <h3 className={styles.sectionTitle}>
                      <User size={16} />
                      Recipient Information
                    </h3>
                    <div className={styles.recipientDetails}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Name:</span>
                        <span className={styles.infoValue}>{validatedOrderData.recipientInfo.recipientName}</span>
                      </div>
                      {validatedOrderData.recipientInfo.recipientPhone && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Phone:</span>
                          <span className={styles.infoValue}>{validatedOrderData.recipientInfo.recipientPhone}</span>
                        </div>
                      )}
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>National ID:</span>
                        <span className={styles.infoValue}>{validatedOrderData.recipientInfo.recipientNationalId}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.recipientInfo}>
                    <h3 className={styles.sectionTitle}>
                      <User size={16} />
                      Buyer Information
                    </h3>
                    <div className={styles.recipientDetails}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Name:</span>
                        <span className={styles.infoValue}>{validatedOrderData.buyerInfo.buyerName}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Email:</span>
                        <span className={styles.infoValue}>{validatedOrderData.buyerInfo.buyerEmail}</span>
                      </div>
                      {validatedOrderData.buyerInfo.buyerPhone && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Phone:</span>
                          <span className={styles.infoValue}>{validatedOrderData.buyerInfo.buyerPhone}</span>
                        </div>
                      )}
                      {validatedOrderData.buyerInfo.buyerNationalId && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>National ID:</span>
                          <span className={styles.infoValue}>{validatedOrderData.buyerInfo.buyerNationalId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.orderItems}>
                  <h3 className={styles.sectionTitle}>
                    <Package size={16} />
                    Order Items
                  </h3>
                  <div className={styles.itemsList}>
                    {validatedOrderData.items.map((item: any) => (
                      <div key={item.id} className={styles.itemRow}>
                        <span className={styles.itemQuantity}>{item.quantity}x</span>
                        <span className={styles.itemName}>{item.product.name}</span>
                        <span className={styles.itemPrice}>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: validatedOrderData.currency,
                          }).format(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleCloseSuccessModal}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};