import React from 'react';
import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Edit3, Save, X, User, Mail, Building, MapPin, Phone, Globe, FileText } from 'lucide-react';

import { useAuth } from '../helpers/useAuth';
import { useProfile } from '../helpers/useProfile';
import { useBusinessProfile } from '../helpers/useBusinessProfile';
import { schema as updateProfileSchema, postProfileUpdate } from '../endpoints/profile/update_POST.schema';
import { schema as updateBusinessProfileSchema, postBusinessProfileUpdate } from '../endpoints/business/profile_POST.schema';
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
import styles from './BusinessProfile.module.css';

type UserFormValues = z.infer<typeof updateProfileSchema>;
type BusinessFormValues = z.infer<typeof updateBusinessProfileSchema>;

export const BusinessProfile: React.FC<{ className?: string }> = ({ className }) => {
  const { authState } = useAuth();
  const { data: user, error: profileError, isFetching: isProfileLoading, refetch: refetchProfile } = useProfile();
  const { data: businessProfile, error: businessError, isFetching: isBusinessLoading, refetch: refetchBusinessProfile } = useBusinessProfile();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Only allow business users
  if (authState.type !== 'authenticated' || authState.user.role !== 'business') {
    return (
      <div className={`${styles.profileCard} ${className || ''}`}>
        <div className={styles.cardContent}>
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>Access denied. This page is only for business owners.</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'} 
              size="sm"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const userForm = useForm({
    schema: updateProfileSchema,
    defaultValues: {
      displayName: '',
      email: '',
      address: '',
      phone: '',
      nationalId: '',
    },
  });

  const businessForm = useForm({
    schema: updateBusinessProfileSchema,
    defaultValues: {
      businessName: '',
      address: '',
      description: '',
      businessType: '',
      phone: '',
      website: '',
    },
  });

  const { setValues: setUserValues } = userForm;
  const { setValues: setBusinessValues } = businessForm;

  useEffect(() => {
    if (user) {
      setUserValues({
        displayName: user.displayName,
        email: user.email,
        address: user.address || '',
        phone: user.phone || '',
        nationalId: user.nationalId || '',
      });
    }
  }, [user, isEditing, setUserValues]);

  useEffect(() => {
    if (businessProfile?.businessProfile) {
      const bp = businessProfile.businessProfile;
      setBusinessValues({
        businessName: bp.businessName || '',
        address: bp.address || '',
        description: bp.description || '',
        businessType: bp.businessType || '',
        phone: bp.phone || '',
        website: bp.website || '',
      });
    }
  }, [businessProfile, isEditing, setBusinessValues]);

  const userMutation = useMutation({
    mutationFn: postProfileUpdate,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'session'], updatedUser);
      toast.success('Personal information updated successfully!');
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(`Personal info update failed: ${error.message}`);
        if (error.message.toLowerCase().includes('email')) {
          userForm.setFieldError('email', error.message);
        }
      } else {
        toast.error('An unknown error occurred.');
      }
    },
  });

  const businessMutation = useMutation({
    mutationFn: postBusinessProfileUpdate,
    onSuccess: (updatedBusiness) => {
      // Update business profile cache
      queryClient.setQueryData(
        ['business', 'profile', authState.user.id], 
        { businessProfile: updatedBusiness }
      );
      toast.success('Business information updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(`Business info update failed: ${error.message}`);
      } else {
        toast.error('An unknown error occurred.');
      }
    },
  });

  const handleSave = async () => {
    try {
      // Save both personal and business information
      await Promise.all([
        userMutation.mutateAsync({
          ...userForm.values,
          address: userForm.values.address?.trim() || undefined,
          phone: userForm.values.phone?.trim() || undefined,
          nationalId: userForm.values.nationalId?.trim() || undefined,
        }),
        businessMutation.mutateAsync({
          ...businessForm.values,
          address: businessForm.values.address?.trim() || undefined,
          description: businessForm.values.description?.trim() || undefined,
          businessType: businessForm.values.businessType?.trim() || undefined,
          phone: businessForm.values.phone?.trim() || undefined,
          website: businessForm.values.website?.trim() || undefined,
        })
      ]);
    } catch (error) {
      // Individual error handling is done in the mutations
      console.error('Error saving profile:', error);
    }
  };

  const isLoading = userMutation.isPending || businessMutation.isPending;

  // Show loading skeleton while fetching profile data
  if ((isProfileLoading && !user) || (isBusinessLoading && !businessProfile)) {
    return (
      <div className={`${styles.profileCard} ${className || ''}`}>
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <Skeleton className={styles.avatarSkeleton} />
            <div>
              <Skeleton style={{ width: '10rem', height: '1.5rem', marginBottom: 'var(--spacing-2)' }} />
              <Skeleton style={{ width: '14rem', height: '1rem' }} />
            </div>
          </div>
          <Skeleton style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius)' }} />
        </div>
        <div className={styles.cardContent}>
          <div className={styles.infoGrid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={styles.infoItem}>
                <Skeleton style={{ width: '1rem', height: '1rem', marginTop: '0.25rem' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: '6rem', height: '0.75rem', marginBottom: 'var(--spacing-1)' }} />
                  <Skeleton style={{ width: '10rem', height: '1rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile fetch failed
  if ((profileError && !user) || (businessError && !businessProfile)) {
    return (
      <div className={`${styles.profileCard} ${className || ''}`}>
        <div className={styles.cardContent}>
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>Failed to load business profile data</p>
            <Button 
              variant="outline" 
              onClick={() => {
                refetchProfile();
                refetchBusinessProfile();
              }} 
              size="sm"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no user data available, don't render
  if (!user || !businessProfile?.businessProfile) {
    return (
      <div className={`${styles.profileCard} ${className || ''}`}>
        <div className={styles.cardContent}>
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>Business profile not found</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/business-dashboard'} 
              size="sm"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getFallback = (name?: string) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'B';

  const bp = businessProfile.businessProfile;

  return (
    <div className={`${styles.profileCard} ${className || ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.headerInfo}>
          <Avatar className={styles.avatar}>
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
            <AvatarFallback>{getFallback(bp.businessName)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className={styles.cardTitle}>{bp.businessName}</h2>
            <p className={styles.cardSubtitle}>Business Profile Management</p>
          </div>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="icon-md" 
            onClick={() => {
              console.log('Edit button clicked');
              setIsEditing(true);
            }} 
            aria-label="Edit profile"
          >
            <Edit3 size={16} />
          </Button>
        )}
      </div>

      <div className={styles.cardContent}>
        {isEditing ? (
          <div className={styles.editingContainer}>
            {/* Business Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Business Information</h3>
              <Form {...businessForm}>
                <div className={styles.form}>
                  <FormItem name="businessName">
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your business name"
                        value={businessForm.values.businessName}
                        onChange={(e) => businessForm.setValues((prev) => ({ ...prev, businessName: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem name="businessType">
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Restaurant, Retail, Service"
                        value={businessForm.values.businessType}
                        onChange={(e) => businessForm.setValues((prev) => ({ ...prev, businessType: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem name="address">
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your business address"
                        value={businessForm.values.address}
                        onChange={(e) => businessForm.setValues((prev) => ({ ...prev, address: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem name="phone">
                    <FormLabel>Business Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your business phone number"
                        value={businessForm.values.phone}
                        onChange={(e) => businessForm.setValues((prev) => ({ ...prev, phone: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem name="website">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://your-business-website.com"
                        value={businessForm.values.website}
                        onChange={(e) => businessForm.setValues((prev) => ({ ...prev, website: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem name="description">
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of your business"
                        value={businessForm.values.description}
                        onChange={(e) => businessForm.setValues((prev) => ({ ...prev, description: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              </Form>
            </div>

            {/* Personal Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Owner Information</h3>
              <Form {...userForm}>
                <div className={styles.form}>
                  <FormItem name="displayName">
                    <FormLabel>Owner Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        value={userForm.values.displayName}
                        onChange={(e) => userForm.setValues((prev) => ({ ...prev, displayName: e.target.value }))}
                        disabled={isLoading}
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
                        value={userForm.values.email}
                        onChange={(e) => userForm.setValues((prev) => ({ ...prev, email: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem name="phone">
                    <FormLabel>Personal Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your personal phone number"
                        value={userForm.values.phone}
                        onChange={(e) => userForm.setValues((prev) => ({ ...prev, phone: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem name="nationalId">
                    <FormLabel>National ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your national ID"
                        value={userForm.values.nationalId}
                        onChange={(e) => userForm.setValues((prev) => ({ ...prev, nationalId: e.target.value }))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              </Form>
            </div>

            {/* Form Actions */}
            <div className={styles.formActions}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)} 
                disabled={isLoading}
              >
                <X size={16} />
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSave} 
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : <Save size={16} />}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.displayContainer}>
            {/* Business Information Display */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Business Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <Building size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Business Name</span>
                    <p className={styles.infoValue}>{bp.businessName}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <FileText size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Business Type</span>
                    <p className={styles.infoValue}>{bp.businessType || 'Not specified'}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <MapPin size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Business Address</span>
                    <p className={styles.infoValue}>{bp.address || 'Not specified'}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Phone size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Business Phone</span>
                    <p className={styles.infoValue}>{bp.phone || 'Not specified'}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Globe size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Website</span>
                    <p className={styles.infoValue}>
                      {bp.website ? (
                        <a href={bp.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>
                          {bp.website}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <FileText size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Description</span>
                    <p className={styles.infoValue}>{bp.description || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Information Display */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Owner Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <User size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Owner Name</span>
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
                  <Phone size={16} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Personal Phone</span>
                    <p className={styles.infoValue}>{user.phone || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

