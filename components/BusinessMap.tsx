import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '../helpers/useIsMobile';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { AlertTriangle, WifiOff, MapPin, Gift, ShoppingBag, Heart, Lock, LogIn } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { getBusinesses, Business } from '../endpoints/businesses_GET.schema';
import { useAuth } from '../helpers/useAuth';
import { Skeleton } from './Skeleton';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { UserProductBrowsing } from './UserProductBrowsing';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from './Dialog';
import styles from './BusinessMap.module.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapSkeleton = () => (
  <div className={styles.skeletonContainer}>
    <div className={styles.skeletonHeader}>
      <Skeleton style={{ width: '200px', height: '24px' }} />
      <Skeleton style={{ width: '150px', height: '20px' }} />
    </div>
    <div className={styles.skeletonMap}>
      <Skeleton style={{ width: '100%', height: '100%' }} />
    </div>
  </div>
);

const MapError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className={styles.errorContainer}>
    <div className={styles.errorContent}>
      <AlertTriangle size={48} className={styles.errorIcon} />
      <h3 className={styles.errorTitle}>Could not load businesses</h3>
      <p className={styles.errorMessage}>There was an issue fetching the business locations. Please check your connection and try again.</p>
      <Button onClick={onRetry}>
        <WifiOff size={16} />
        Try Again
      </Button>
    </div>
  </div>
);

const AuthPromptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}> = ({ isOpen, onClose, businessName }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className={styles.authPromptContent}>
      <DialogHeader>
        <DialogTitle className={styles.authPromptTitle}>
          <Lock size={20} />
          Login Required
        </DialogTitle>
        <DialogDescription>
          You need to be logged in to send gifts or shop at {businessName}.
        </DialogDescription>
      </DialogHeader>

      <div className={styles.authPromptBody}>
        <div className={styles.authPromptIcon}>
          <Gift size={48} className={styles.giftIcon} />
        </div>
        <p className={styles.authPromptMessage}>
          Create an account or sign in to start sending thoughtful gifts to your loved ones.
        </p>
        <div className={styles.authPromptActions}>
          <Button onClick={() => window.location.href = '/login'} className={styles.loginButton}>
            <LogIn size={16} />
            Sign In
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/register'}>
            Create Account
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface BusinessMapProps {
  className?: string;
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business) => void;
  onBackToMap: () => void;
  excludeBusinessId?: number; // For Agent Sellers to exclude their own business
}

export const BusinessMap: React.FC<BusinessMapProps> = ({ 
  className, 
  selectedBusiness, 
  onBusinessSelect,
  onBackToMap,
  excludeBusinessId
}) => {
  const { authState } = useAuth();
  const isMobile = useIsMobile();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptBusinessName, setAuthPromptBusinessName] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: businesses, isFetching, isError, refetch } = useQuery({
    queryKey: ['businesses'],
    queryFn: getBusinesses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter out the excluded business (for Agent Sellers)
  const filteredBusinesses = useMemo(() => {
    console.log('BusinessMap Debug:', {
      businesses: businesses?.length || 0,
      excludeBusinessId,
      businessesData: businesses
    });
    
    if (!businesses) return [];
    if (!excludeBusinessId) return businesses;
    
    const filtered = businesses.filter(business => business.id !== excludeBusinessId);
    console.log('Filtered businesses:', filtered.length, 'out of', businesses.length);
    return filtered;
  }, [businesses, excludeBusinessId]);

  // Default center: Harare, Zimbabwe
  const defaultCenter: [number, number] = [-17.8252, 31.0335];
  const defaultZoom = 10;

  // Get user's current location on mount
  useEffect(() => {
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        console.log('Geolocation is not supported by this browser');
        setLocationError('Geolocation not supported');
        setIsLoadingLocation(false);
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setLocationError(null);
          setIsLoadingLocation(false);
          console.log('User location obtained:', { latitude, longitude });
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          let errorMessage = 'Location access denied';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'Unknown location error';
              break;
          }
          
          setLocationError(errorMessage);
          setIsLoadingLocation(false);
        },
        options
      );
    };

    getCurrentLocation();
  }, []);

  // Calculate map center prioritizing user location
  const mapCenter: [number, number] = useMemo(() => {
    // First priority: user's current location
    if (userLocation) {
      return userLocation;
    }
    
    // Second priority: average of business locations (fallback behavior)
    if (businesses && businesses.length > 0) {
      const avgLat = businesses.reduce((sum, business) => sum + business.latitude, 0) / businesses.length;
      const avgLng = businesses.reduce((sum, business) => sum + business.longitude, 0) / businesses.length;
      return [avgLat, avgLng];
    }
    
    // Final fallback: default center
    return defaultCenter;
  }, [userLocation, businesses]);

  const handleBusinessSelectInternal = (business: Business) => {
    if (authState.type !== 'authenticated') {
      setAuthPromptBusinessName(business.name);
      setIsAuthPromptOpen(true);
      return;
    }
    
    onBusinessSelect(business);
  };

  const handleCloseAuthPrompt = () => {
    setIsAuthPromptOpen(false);
    setAuthPromptBusinessName('');
  };

  if (isFetching || isLoadingLocation) {
    return <MapSkeleton />;
  }

  if (isError) {
    return <MapError onRetry={() => refetch()} />;
  }

  // If a business is selected, navigate to the business products page
  if (selectedBusiness) {
    // Navigate to the business products page with query parameter
    window.location.href = `/business-products?businessId=${selectedBusiness.id}`;
    return null;
  }

  // Debug logging before rendering
  console.log('BusinessMap Rendering:', {
    isFetching,
    isLoadingLocation,
    isError,
    filteredBusinesses: filteredBusinesses?.length || 0,
    mapCenter,
    defaultZoom
  });

  // Default map view
  return (
    <>
      <div className={`${styles.mapContainer} ${className || ''}`}>
        {/* Temporary debug overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          zIndex: 1000,
          fontSize: '12px'
        }}>
          Businesses: {filteredBusinesses?.length || 0} | Center: {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
        </div>
        
        <div className={styles.leafletMapWrapper}>
          <MapContainer
            center={mapCenter}
            zoom={defaultZoom}
            scrollWheelZoom={true}
            zoomControl={!isMobile}
            touchZoom={true}
            className={styles.leafletMap}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredBusinesses?.map((business) => (
              <Marker
                key={business.id}
                position={[business.latitude, business.longitude]}
              >
                <Popup className={styles.customPopup} minWidth={250} maxWidth={300}>
                  <div className={styles.popupContent}>
                    <div className={styles.popupHeader}>
                      <div className={styles.businessIcon}>
                        <Gift size={20} />
                      </div>
                      <div className={styles.businessInfo}>
                        <h4 className={styles.businessName}>{business.name}</h4>
                        {business.businessType && (
                          <p className={styles.businessType}>{business.businessType}</p>
                        )}
                        <p className={styles.businessAddress}>{business.address}</p>
                      </div>
                    </div>
                    
                    <div className={styles.popupDetails}>
                      <div className={styles.popupActions}>
                        <Button 
                          size="sm" 
                          className={styles.selectBusinessButton}
                          onClick={() => handleBusinessSelectInternal(business)}
                          disabled={authState.type === 'loading'}
                        >
                          {authState.type === 'loading' ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <ShoppingBag size={14} />
                              View Products
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {businesses?.length === 0 && (
          <div className={styles.emptyState}>
            <Gift size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No gift-enabled businesses found</h3>
            <p className={styles.emptyMessage}>
              There are currently no businesses available for gifting.
            </p>
          </div>
        )}
      </div>

      {/* Authentication Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthPromptOpen}
        onClose={handleCloseAuthPrompt}
        businessName={authPromptBusinessName}
      />

    </>
  );
};