import React from 'react';
import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Edit3, Save, X, User, Mail, Shield, MapPin, Phone, CreditCard } from 'lucide-react';

import { useAuth } from '../helpers/useAuth';
import { useProfile } from '../helpers/useProfile';
import { schema as updateProfileSchema, postProfileUpdate } from '../endpoints/profile/update_POST.schema';
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from './Form';
import { Button } from './Button';
import { Input } from './Input';
import { Spinner } from './Spinner';
import { Skeleton } from './Skeleton';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import styles from './UserProfile.module.css';

type FormValues = z.infer<typeof updateProfileSchema>;

export const UserProfile: React.FC<{ className?: string }> = ({ className }) => {
  const { authState } = useAuth();
  const { data: user, error: profileError, isFetching: isProfileLoading, refetch: refetchProfile } = useProfile();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    schema: updateProfileSchema,
    defaultValues: {
      displayName: '',
      email: '',
      address: '',
      phone: '',
      nationalId: '',
    },
  });

  const { setValues } = form;

  useEffect(() => {
    if (user) {
      setValues({
        displayName: user.displayName,
        email: user.email,
        address: user.address || '',
        phone: user.phone || '',
        nationalId: user.nationalId || '',
      });
    }
  }, [user, isEditing, setValues]);

  const mutation = useMutation({
    mutationFn: postProfileUpdate,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'session'], updatedUser);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(`Update failed: ${error.message}`);
        if (error.message.toLowerCase().includes('email')) {
            form.setFieldError('email', error.message);
        }
      } else {
        toast.error('An unknown error occurred.');
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    // Filter out empty strings to send null for optional fields
    const filteredValues = {
      ...values,
      address: values.address?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      nationalId: values.nationalId?.trim() || undefined,
    };
    mutation.mutate(filteredValues);
  };

  // Check if user is authenticated
  if (authState.type !== 'authenticated') {
    return null;
  }

  // Show loading skeleton while fetching profile data
  if (isProfileLoading && !user) {
    return (
      <div className={`${styles.profileCard} ${className || ''}`}>
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <Skeleton className={styles.avatarSkeleton} />
            <div>
              <Skeleton style={{ width: '8rem', height: '1.5rem', marginBottom: 'var(--spacing-2)' }} />
              <Skeleton style={{ width: '12rem', height: '1rem' }} />
            </div>
          </div>
          <Skeleton style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius)' }} />
        </div>
        <div className={styles.cardContent}>
          <div className={styles.infoGrid}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.infoItem}>
                <Skeleton style={{ width: '1rem', height: '1rem', marginTop: '0.25rem' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: '5rem', height: '0.75rem', marginBottom: 'var(--spacing-1)' }} />
                  <Skeleton style={{ width: '8rem', height: '1rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (profileError && !user) {
    return (
      <div className={`${styles.profileCard} ${className || ''}`}>
        <div className={styles.cardContent}>
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>Failed to load profile data</p>
            <Button variant="outline" onClick={() => refetchProfile()} size="sm">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no user data available, don't render
  if (!user) {
    return null;
  }

  const getFallback = (name?: string) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

  return (
    <div className={`${styles.profileCard} ${className || ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.headerInfo}>
          <Avatar className={styles.avatar}>
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
            <AvatarFallback>{getFallback(user.displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className={styles.cardTitle}>User Profile</h2>
            <p className={styles.cardSubtitle}>Manage your personal information.</p>
          </div>
        </div>
        {!isEditing && (
          <Button variant="ghost" size="icon-md" onClick={() => setIsEditing(true)} aria-label="Edit profile">
            <Edit3 size={16} />
          </Button>
        )}
      </div>

      <div className={styles.cardContent}>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
              <FormItem name="displayName">
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    value={form.values.displayName}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, displayName: e.target.value }))}
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="email">
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={form.values.email}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="address">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your address"
                    value={form.values.address}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, address: e.target.value }))}
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="phone">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your phone number"
                    value={form.values.phone}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, phone: e.target.value }))}
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="nationalId">
                <FormLabel>National ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your national ID"
                    value={form.values.nationalId}
                    onChange={(e) => form.setValues((prev) => ({ ...prev, nationalId: e.target.value }))}
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <div className={styles.formActions}>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={mutation.isPending}>
                  <X size={16} />
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? <Spinner size="sm" /> : <Save size={16} />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <User size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Display Name</span>
                <p className={styles.infoValue}>{user.displayName}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Mail size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Email Address</span>
                <p className={styles.infoValue}>{user.email}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <MapPin size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Address</span>
                <p className={styles.infoValue}>{user.address || 'No address provided'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Phone size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Phone Number</span>
                <p className={styles.infoValue}>{user.phone || 'No phone number provided'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <CreditCard size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>National ID</span>
                <p className={styles.infoValue}>{user.nationalId || 'No national ID provided'}</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Shield size={16} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Role</span>
                <p className={`${styles.infoValue} ${styles.role}`}>{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};