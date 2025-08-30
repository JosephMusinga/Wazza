import React, { useState } from "react";
import { Order } from "../endpoints/business/orders_GET.schema";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Input } from "./Input";
import { Spinner } from "./Spinner";
import { Calendar, Hash, DollarSign, ShoppingBag, CheckCircle, User, Phone } from "lucide-react";
import { useVerifyOrder } from "../helpers/useVerifyOrder";
import { toast } from "sonner";
import styles from "./BusinessOrderCard.module.css";

interface BusinessOrderCardProps {
  order: Order;
  className?: string;
  onSelect?: (order: Order) => void;
  isSelected?: boolean;
  onRedeemSuccess?: (order: Order) => void;
  onRedemptionValidated?: (validatedOrder: any) => void;
}

const getStatusVariant = (
  status: string
): "success" | "warning" | "destructive" | "secondary" | "default" => {
  switch (status) {
    case "completed":
    case "redeemed":
    case "collected":
      return "success";
    case "processing":
      return "warning";
    case "cancelled":
    case "refunded":
      return "destructive";
    case "pending":
      return "default";
    default:
      return "secondary";
  }
};

export const BusinessOrderCard = ({
  order,
  className,
  onSelect,
  isSelected = false,
  onRedeemSuccess,
  onRedemptionValidated,
}: BusinessOrderCardProps) => {
  const [showRedemptionInput, setShowRedemptionInput] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState("");
  const verifyOrderMutation = useVerifyOrder();

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(order);
    }
  };

  const handleRedeemGift = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (showRedemptionInput) {
      // Submit redemption
      if (redemptionCode.trim()) {
        verifyOrderMutation.mutate(
          { 
            orderId: order.id,
            redemptionCode: redemptionCode.trim() 
          },
          {
            onSuccess: (data) => {
              setShowRedemptionInput(false);
              setRedemptionCode("");
              
              // Call the validation success callback to show modal
              if (onRedemptionValidated) {
                onRedemptionValidated(data);
              }
              
              // Call the success callback to invalidate queries
              if (onRedeemSuccess) {
                onRedeemSuccess(order);
              }
            },
            onError: (error) => {
              const errorMessage = error.message || "Invalid verification code. Please try again.";
              toast.error(`Verification Failed: ${errorMessage}`);
              console.error("Order verification failed:", error);
            },
          }
        );
      }
    } else {
      // Show input field
      setShowRedemptionInput(true);
    }
  };

  const handleCancelRedemption = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowRedemptionInput(false);
    setRedemptionCode("");
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(order.createdAt));

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency,
  }).format(order.totalAmount);

  return (
    <article 
      className={`${styles.card} ${isSelected ? styles.selected : ""} ${onSelect ? styles.clickable : ""} ${className || ""}`}
      onClick={handleCardClick}
    >
      <header className={styles.cardHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.infoItem}>
            <Hash size={14} />
            <span>Order #{order.id}</span>
          </div>
          <div className={styles.infoItem}>
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
        </div>
        <Badge variant={getStatusVariant(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </header>

      <div className={styles.cardBody}>
        <section className={styles.collectorInfo}>
          <h3 className={styles.sectionTitle}>
            <User size={16} />
            <span>Collector Information</span>
          </h3>
          <div className={styles.collectorDetails}>
            <div className={styles.collectorItem}>
              <User size={14} />
              <span className={styles.collectorName}>
                {order.collector.name || "Not specified"}
              </span>
            </div>
            {order.collector.phone && (
              <div className={styles.collectorItem}>
                <Phone size={14} />
                <span className={styles.collectorPhone}>
                  {order.collector.phone}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className={styles.itemsInfo}>
          <h3 className={styles.sectionTitle}>
            <ShoppingBag size={16} />
            <span>Order Items</span>
          </h3>
          <ul className={styles.itemList}>
            {order.items.map((item: Order['items'][0]) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.itemQuantity}>{item.quantity}x</span>
                <span className={styles.itemName}>{item.product.name}</span>
                <span className={styles.itemPrice}>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: order.currency,
                  }).format(item.totalPrice)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className={styles.cardFooter}>
        <div className={styles.totalAmount}>
          <DollarSign size={18} />
          <span>Total: {formattedTotal}</span>
        </div>
        {order.status === "pending" && (
          <div className={styles.redemptionSection}>
            {showRedemptionInput ? (
              <div className={styles.redemptionForm}>
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={redemptionCode}
                  onChange={(e) => setRedemptionCode(e.target.value)}
                  className={styles.redemptionInput}
                  disabled={verifyOrderMutation.isPending}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className={styles.redemptionButtons}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelRedemption}
                    disabled={verifyOrderMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRedeemGift}
                    disabled={!redemptionCode.trim() || verifyOrderMutation.isPending}
                  >
                    {verifyOrderMutation.isPending ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRedeemGift}
              >
                Verify Code
              </Button>
            )}
          </div>
        )}
      </footer>
    </article>
  );
};