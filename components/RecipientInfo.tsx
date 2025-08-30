import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './Input';
import { Button } from './Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './RecipientInfo.module.css';

// Enhanced validation schema for recipient information
const recipientInfoSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required.'),
  recipientPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits.')
    .regex(
      /^\+?[\d\s().-]{10,}$/,
      'Please enter a valid phone number format.',
    ),
  recipientNationalId: z
    .string()
    .min(5, 'National ID must be at least 5 characters.')
    .max(20, 'National ID must be no more than 20 characters.')
    .regex(
      /^[A-Za-z0-9\-\s]+$/,
      'National ID can only contain letters, numbers, hyphens, and spaces.',
    ),
});

export type RecipientInfoData = z.infer<typeof recipientInfoSchema>;

interface RecipientInfoProps {
  className?: string;
  initialData?: Partial<RecipientInfoData>;
  onSubmit: (data: RecipientInfoData) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export const RecipientInfo: React.FC<RecipientInfoProps> = ({
  className,
  initialData,
  onSubmit,
  onBack,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RecipientInfoData>({
    resolver: zodResolver(recipientInfoSchema),
    defaultValues: initialData,
    mode: 'onChange',
  });

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="recipientName" className={styles.label}>
            Recipient's Full Name
          </label>
          <Controller
            name="recipientName"
            control={control}
            render={({ field }) => (
              <Input
                id="recipientName"
                placeholder="e.g., Jane Doe"
                {...field}
              />
            )}
          />
          {errors.recipientName && (
            <p className={styles.errorText}>{errors.recipientName.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="recipientPhone" className={styles.label}>
            Recipient's Phone Number
          </label>
          <Controller
            name="recipientPhone"
            control={control}
            render={({ field }) => (
              <Input
                id="recipientPhone"
                type="tel"
                placeholder="e.g., (555) 123-4567"
                {...field}
              />
            )}
          />
          {errors.recipientPhone && (
            <p className={styles.errorText}>{errors.recipientPhone.message}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="recipientNationalId" className={styles.label}>
            Recipient's National ID
          </label>
          <Controller
            name="recipientNationalId"
            control={control}
            render={({ field }) => (
              <Input
                id="recipientNationalId"
                placeholder="e.g., AB123456789 or 123-456-789"
                {...field}
              />
            )}
          />
          {errors.recipientNationalId && (
            <p className={styles.errorText}>
              {errors.recipientNationalId.message}
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          {onBack && (
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ArrowLeft size={16} /> Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={styles.submitButton}
          >
            Next <ArrowRight size={16} />
          </Button>
        </footer>
      </form>
    </div>
  );
};