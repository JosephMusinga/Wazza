import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, MapPin } from "lucide-react";
import superjson from "superjson";
import { useAuth } from "../helpers/useAuth";
import { Button } from "../components/Button";
import { UserProductBrowsing } from "../components/UserProductBrowsing";
import { Spinner } from "../components/Spinner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "../components/Dialog";
import styles from "./business-products.module.css";

const BusinessProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();
  const [businessInfoOpen, setBusinessInfoOpen] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Extract businessId from query parameters
  const businessId = new URLSearchParams(location.search).get('businessId');
  
  // Fetch business data based on businessId
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!businessId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch real business data from the API
        const response = await fetch('/_api/businesses');
        if (!response.ok) {
          throw new Error('Failed to fetch businesses');
        }
        
        const responseText = await response.text();
        const businesses = superjson.parse(responseText);
        
        // Ensure businesses is an array
        if (!Array.isArray(businesses)) {
          throw new Error('Invalid response format from businesses API');
        }
        
        const foundBusiness = businesses.find((b: any) => b.id === parseInt(businessId));
        
        if (!foundBusiness) {
          throw new Error('Business not found');
        }
        
        setBusiness(foundBusiness);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessData();
  }, [businessId]);


  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div>Loading...</div>
          <p>Loading business information...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !business) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error Loading Business</h2>
          <p>{error || 'Business not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{business.name} - Products - Floot</title>
        <meta name="description" content={`Browse products from ${business.name}`} />
      </Helmet>
      
      <div className={styles.container}>
        {/* Business Title */}
        <div className={styles.businessHeader}>
          <div className={styles.businessTitle}>
            <h1 className={styles.businessName}>{business.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              className={styles.infoButton}
              onClick={() => setBusinessInfoOpen(true)}
              aria-label="Business Information"
            >
              <AlertCircle size={18} />
            </Button>
          </div>
        </div>

        {/* Business Products Content */}
        <main className={styles.mainContent}>
          <UserProductBrowsing 
            businessId={parseInt(businessId || "0")} 
            business={business}
          />
        </main>

        {/* Business Information Popup */}
        <Dialog open={businessInfoOpen} onOpenChange={setBusinessInfoOpen}>
          <DialogContent className={styles.businessInfoDialog}>
            <DialogHeader>
              <DialogTitle className={styles.businessInfoTitle}>
                Business Information
              </DialogTitle>
            </DialogHeader>
            
            <div className={styles.businessInfoContent}>
              <div className={styles.businessInfoSection}>
                <h3 className={styles.businessInfoName}>{business.name}</h3>
                {business.businessType && (
                  <span className={styles.businessInfoType}>{business.businessType}</span>
                )}
                <p className={styles.businessInfoAddress}>
                  <MapPin size={16} />
                  {business.address}
                </p>
                {business.description && (
                  <p className={styles.businessInfoDescription}>{business.description}</p>
                )}
              </div>
              
              <div className={styles.businessContactSection}>
                <h4 className={styles.contactSectionTitle}>Contact Details</h4>
                {business.phone && (
                  <div className={styles.contactInfoItem}>
                    <span className={styles.contactInfoLabel}>Phone:</span>
                    <span className={styles.contactInfoValue}>{business.phone}</span>
                  </div>
                )}
                {business.website && (
                  <div className={styles.contactInfoItem}>
                    <span className={styles.contactInfoLabel}>Website:</span>
                    <a 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactInfoWebsite}
                    >
                      {business.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default BusinessProductsPage;
