import React from 'react';
import { useState, useMemo } from 'react';
import { useShoppingCart, CartItem } from '../helpers/useShoppingCart';
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { z } from 'zod';
import { Input } from './Input';
import { Button } from './Button';
import { Checkout, RecipientInfo } from './Checkout';
import { ArrowLeft, Gift, User, PackageCheck, Copy } from 'lucide-react';
import styles from './UserCheckout.module.css';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getBusinesses } from '../endpoints/businesses_GET.schema';

export interface UserCheckoutProps {
  /** The ID of the business to checkout from. */
  businessId: number;
  /** Optional className for the container. */
  className?: string;
}

type CheckoutStep = 'selection' | 'gift_form' | 'confirmation' | 'success';

const recipientSchema = z.object({
  name: z.string().min(2, { message: 'Recipient name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  nationalId: z.string().min(1, { message: 'National ID is required.' }).max(50, { message: 'National ID is too long.' }),
});

type RecipientFormData = z.infer<typeof recipientSchema>;

export const UserCheckout: React.FC<UserCheckoutProps> = ({ businessId, className }) => {
  const { cartForBusiness, clearCart } = useShoppingCart();
  const [step, setStep] = useState<CheckoutStep>('selection');
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | undefined>();
  const [purchaseType, setPurchaseType] = useState<'self' | 'recipient'>('self');
  const [successInfo, setSuccessInfo] = useState<{ orderId: number; code: string } | null>(null);

  const cartItems = useMemo(() => cartForBusiness(businessId), [cartForBusiness, businessId]);
  const itemsArray = Object.values(cartItems);

  // Query to fetch business information
  const { data: businesses, isFetching: isLoadingBusinesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => getBusinesses(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const business = useMemo(() => {
    return businesses?.find(b => b.id === businessId);
  }, [businesses, businessId]);

  const form = useForm({
    schema: recipientSchema,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      nationalId: '',
    },
  });

  const handleGiftSubmit = (data: RecipientFormData) => {
    setRecipientInfo(data);
    setPurchaseType('recipient');
    setStep('confirmation');
  };

  const handleSelfPurchase = () => {
    setPurchaseType('self');
    setStep('confirmation');
  };

  const handleSuccess = (orderId: number, code: string) => {
    setSuccessInfo({ orderId, code });
    setStep('success');
    // The checkout component already clears the cart, but we ensure it here too.
    clearCart();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Code copied to clipboard!');
    });
  };

  const renderContent = () => {
    switch (step) {
      case 'selection':
        return (
          <div className={styles.selectionContainer}>
            <div className={styles.selectionButtons}>
              <Button size="lg" onClick={() => setStep('gift_form')} className={styles.continueButton}>
                Accept & Continue
              </Button>
            </div>
          </div>
        );

      case 'gift_form':
        return (
          <div className={styles.formContainer}>
            <div className={styles.stepHeader}>
              <Button variant="ghost" size="icon" onClick={() => setStep('selection')} className={styles.backButton}>
                <ArrowLeft size={20} />
              </Button>
              <h3 className={styles.stepTitle}>Recipient Information</h3>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGiftSubmit)} className={styles.form}>
                <FormItem name="name">
                  <FormLabel>Recipient's Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Jane Doe"
                      value={form.values.name}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name="email">
                  <FormLabel>Recipient's Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g., jane@example.com"
                      value={form.values.email}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </FormControl>
                  <FormDescription>Order confirmation will be sent to this email address.</FormDescription>
                  <FormMessage />
                </FormItem>
                <FormItem name="phone">
                  <FormLabel>Recipient's Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="e.g., (555) 123-4567"
                      value={form.values.phone}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </FormControl>
                  <FormDescription>An SMS with the redemption code will be sent here.</FormDescription>
                  <FormMessage />
                </FormItem>
                <FormItem name="nationalId">
                  <FormLabel>Recipient's National ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 123456789"
                      value={form.values.nationalId}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, nationalId: e.target.value }))}
                    />
                  </FormControl>
                  <FormDescription>This will be used to identify the recipient when collecting the gift.</FormDescription>
                  <FormMessage />
                </FormItem>
                <Button type="submit" size="lg" className={styles.submitButton}>
                  Continue to Confirmation
                </Button>
              </form>
            </Form>
          </div>
        );

      case 'confirmation':
        return (
          <div>
            <div className={styles.stepHeader}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(purchaseType === 'recipient' ? 'gift_form' : 'selection')}
                className={styles.backButton}
              >
                <ArrowLeft size={20} />
              </Button>
              <h3 className={styles.stepTitle}>Confirm Your Order</h3>
            </div>
            <Checkout
              businessId={businessId}
              cartItems={cartItems}
              purchaseType={purchaseType}
              recipientInfo={recipientInfo}
              onSuccess={handleSuccess}
            />
          </div>
        );

      case 'success':
        if (!successInfo) return null;
        return (
          <div className={styles.successContainer}>
            <PackageCheck size={64} className={styles.successIcon} />
            <h2 className={styles.successTitle}>
              {purchaseType === 'recipient' ? 'Gift Sent Successfully!' : 'Order Placed!'}
            </h2>
            <p className={styles.successMessage}>
              {purchaseType === 'recipient'
                ? `An SMS with the redemption code has been sent to ${recipientInfo?.name}.`
                : 'Your order is confirmed. Present the pickup code at the store.'}
            </p>
            <div className={styles.successDetails}>
              <div className={styles.detailRow}>
                <span className={styles.orderNumberLabel}>
                  {isLoadingBusinesses ? 'Loading order details...' : 
                   `Order #${successInfo.orderId}${business?.name ? ` at ${business.name}` : ''}`}
                </span>
              </div>
              {purchaseType === 'self' && (
                <div className={styles.detailRow}>
                  <span>Your Pickup Code:</span>
                  <div className={styles.codeWrapper}>
                    <strong className={styles.code}>{successInfo.code}</strong>
                    <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(successInfo.code)}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
              )}
              {purchaseType === 'recipient' && (
                <div className={styles.detailRow}>
                  <span>Redemption Code:</span>
                  <div className={styles.codeWrapper}>
                    <strong className={styles.code}>{successInfo.code}</strong>
                    <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(successInfo.code)}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={() => setStep('selection')} size="lg" className={styles.continueButton}>
              Place Another Order
            </Button>
          </div>
        );
    }
  };

  if (itemsArray.length === 0 && step !== 'success') {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.emptyState}>
          <h3 className={styles.stepTitle}>Your cart for this business is empty.</h3>
          <p>Add items to your cart to proceed with checkout.</p>
        </div>
      </div>
    );
  }

  return <div className={`${styles.container} ${className || ''}`}>{renderContent()}</div>;
};