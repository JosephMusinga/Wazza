import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getBusinesses, Business } from "../endpoints/businesses_GET.schema";
import { useCreateGiftOrder } from "../helpers/useCreateGiftOrder";
import { useShoppingCart } from "../helpers/useShoppingCart";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { AlertCircle, ArrowLeft, ArrowRight, PackageCheck, Copy, ShoppingBag } from "lucide-react";
import styles from "./UserGiftPurchase.module.css";

const recipientFormSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required."),
  recipientPhone: z.string().min(1, "Recipient phone is required."),
  recipientNationalId: z.string().min(1, "Recipient national ID is required.").max(50, "Recipient national ID is too long."),
  senderName: z.string().min(1, "Sender name is required."),
  senderPhone: z.string().min(1, "Sender phone is required."),
});

type RecipientFormData = z.infer<typeof recipientFormSchema>;

interface UserGiftPurchaseProps {
  className?: string;
  preselectedBusinessId?: number;
  useCartItems?: boolean;
  onComplete?: (redemptionCode: string) => void;
  onCancel?: () => void;
}

export const UserGiftPurchase: React.FC<UserGiftPurchaseProps> = ({ className, preselectedBusinessId, useCartItems = false, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const createGiftOrderMutation = useCreateGiftOrder();
  const shoppingCart = useShoppingCart();

  const { data: businesses, isFetching: isFetchingBusinesses, error: businessesError } = useQuery({
    queryKey: ["allBusinesses"],
    queryFn: getBusinesses,
  });

  // Auto-select preselected business when businesses are loaded
  useEffect(() => {
    if (businesses && preselectedBusinessId && !selectedBusiness) {
      const preselectedBusiness = businesses.find(b => b.id === preselectedBusinessId);
      if (preselectedBusiness) {
        setSelectedBusiness(preselectedBusiness);
        setStep(2); // Always go to recipient info when preselected
      }
    }
  }, [businesses, preselectedBusinessId, selectedBusiness]);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<RecipientFormData>({
    resolver: zodResolver(recipientFormSchema),
    mode: "onChange",
  });

  // Always use shopping cart items
  const activeCart = useMemo(() => {
    if (selectedBusiness) {
      const businessCartItems = shoppingCart.cartForBusiness(selectedBusiness.id);
      // Convert shopping cart format to gift cart format
      return Object.entries(businessCartItems).reduce((acc, [productId, cartItem]) => {
        acc[productId] = { product: cartItem.product, quantity: cartItem.quantity };
        return acc;
      }, {} as Record<string, { product: any; quantity: number }>);
    }
    return {};
  }, [selectedBusiness, shoppingCart]);

  const totalCartItems = useMemo(() => Object.values(activeCart).reduce((sum, item) => sum + item.quantity, 0), [activeCart]);
  const totalCartPrice = useMemo(() => Object.values(activeCart).reduce((sum, item) => sum + item.product.price * item.quantity, 0), [activeCart]);

  // Determine which steps are valid based on configuration
  const validSteps = useMemo(() => {
    const steps = [];
    if (!preselectedBusinessId) steps.push(1); // Business selection
    steps.push(2, 4); // Recipient info, success (removed summary step)
    return steps;
  }, [preselectedBusinessId]);

  // Ensure step is always valid for current configuration
  useEffect(() => {
    if (!validSteps.includes(step)) {
      setStep(validSteps[0]);
    }
  }, [validSteps, step]);

  const getNextValidStep = (currentStep: number) => {
    const currentIndex = validSteps.indexOf(currentStep);
    return currentIndex >= 0 && currentIndex < validSteps.length - 1 ? validSteps[currentIndex + 1] : currentStep;
  };

  const getPrevValidStep = (currentStep: number) => {
    const currentIndex = validSteps.indexOf(currentStep);
    return currentIndex > 0 ? validSteps[currentIndex - 1] : currentStep;
  };

  const handleSelectBusiness = (businessId: string) => {
    const business = businesses?.find(b => b.id === Number(businessId));
    if (business) {
      setSelectedBusiness(business);
      setStep(2); // Go directly to recipient info
    }
  };

  const onSubmit = (data: RecipientFormData) => {
    if (!selectedBusiness || totalCartItems === 0) return;
    
    createGiftOrderMutation.mutate({
      businessId: selectedBusiness.id,
      items: Object.values(activeCart).map(item => ({ productId: item.product.id, quantity: item.quantity })),
      ...data,
    }, {
      onSuccess: () => {
        setStep(4); // Go directly to success step
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Maybe show a toast notification here in a real app
      console.log("Copied to clipboard");
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Select Business
        return (
          <div>
            <h3 className={styles.stepTitle}>Step 1: Choose a Business Location</h3>
            {isFetchingBusinesses && <Skeleton style={{ height: '40px', width: '100%' }} />}
            {businessesError && <p className={styles.errorText}>{businessesError.message}</p>}
            {businesses && (
              <Select onValueChange={handleSelectBusiness}>
                <SelectTrigger><SelectValue placeholder="Select a business..." /></SelectTrigger>
                <SelectContent>
                  {businesses.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      <div className={styles.businessSelectItem}>
                        <span>{b.name}</span>
                        <span className={styles.businessAddress}>{b.address}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      case 2: // Recipient Info
        return (
          <div>
            {totalCartItems > 0 && (
              <div className={styles.cartItemsNotice}>
                <p className={styles.cartItemsMessage}>
                  <ShoppingBag size={16} />
                  Order includes {totalCartItems} item{totalCartItems !== 1 ? 's' : ''} from {selectedBusiness?.name} (${totalCartPrice.toFixed(2)})
                </p>
              </div>
            )}
            <form className={styles.form}>
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}>Recipient Details</h4>
                <Controller name="recipientName" control={control} render={({ field }) => <Input placeholder="Recipient's Full Name" {...field} />} />
                {errors.recipientName && <p className={styles.errorText}>{errors.recipientName.message}</p>}
                <Controller name="recipientPhone" control={control} render={({ field }) => <Input placeholder="Recipient's Phone Number" {...field} />} />
                {errors.recipientPhone && <p className={styles.errorText}>{errors.recipientPhone.message}</p>}
                <Controller name="recipientNationalId" control={control} render={({ field }) => <Input placeholder="Recipient's National ID" {...field} />} />
                {errors.recipientNationalId && <p className={styles.errorText}>{errors.recipientNationalId.message}</p>}
              </div>
              
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}>Sender's Details</h4>
                <Controller name="senderName" control={control} render={({ field }) => <Input placeholder="Sender's Full Name" {...field} />} />
                {errors.senderName && <p className={styles.errorText}>{errors.senderName.message}</p>}
                <Controller name="senderPhone" control={control} render={({ field }) => <Input placeholder="Sender's Phone Number" {...field} />} />
                {errors.senderPhone && <p className={styles.errorText}>{errors.senderPhone.message}</p>}
              </div>
              
            </form>
          </div>
        );
      case 4: // Success
        const order = createGiftOrderMutation.data;
        const recipientPhone = order?.recipientPhone || 'recipient';
        const businessName = selectedBusiness?.name || 'the business';
        const businessAddress = selectedBusiness?.address || 'business location';
        
        return (
          <div className={styles.successState}>
            <PackageCheck size={64} className={styles.successIcon} />
            <h3 className={styles.successTitle}>Order ready for collection at {businessName} and {businessAddress}</h3>
            <p className={styles.successMessage}>The code was sent to {recipientPhone}</p>
            <div className={styles.orderDetails}>
              <div className={styles.orderNumber}>
                Order #{order?.id}
              </div>
              <div className={styles.redemptionCodeWrapper}>
                <span className={styles.redemptionCode}>{order?.redemptionCode}</span>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(order?.redemptionCode || '')}><Copy size={20} /></Button>
              </div>
            </div>
            <div className={styles.successActions}>
              <Button onClick={() => {
                const redemptionCode = order?.redemptionCode || '';
                if (onComplete) {
                  onComplete(redemptionCode);
                } else {
                  setStep(validSteps[0]);
                  if (!preselectedBusinessId) {
                    setSelectedBusiness(null);
                  }
                  createGiftOrderMutation.reset();
                  shoppingCart.clearCart();
                }
              }}>Send another gift</Button>
              <Button variant="outline" onClick={() => {
                const redemptionCode = order?.redemptionCode || '';
                if (onComplete) {
                  onComplete(redemptionCode);
                } else {
                  shoppingCart.clearCart();
                }
              }}>Close</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.content}>
        {renderStep()}
      </div>
      {step < 4 && (
        <footer className={styles.footer}>
          <Button variant="outline" onClick={onCancel || (() => setStep(getPrevValidStep(step)))} disabled={step === validSteps[0] && !onCancel}>
            <ArrowLeft size={16} /> Back
          </Button>
          {step === 2 && (
            <Button 
              onClick={handleSubmit(onSubmit)} 
              disabled={createGiftOrderMutation.isPending || !isValid}
              size="lg"
              className={styles.acceptButton}
            >
              {createGiftOrderMutation.isPending ? <Spinner size="sm" /> : "Accept & Continue"}
            </Button>
          )}
        </footer>
      )}
    </div>
  );
};