import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ShoppingCart, AlertCircle, MapPin } from "lucide-react";
import { Button } from "../components/Button";
import { NotificationBell } from "../components/NotificationBell";
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
        
        // For now, use mock data to test the page
        const mockBusiness = {
          id: parseInt(businessId),
          name: businessId === '3' ? 'Fashion Pokice' : 'Flava Restaurant',
          businessType: businessId === '3' ? 'Clothing' : 'Restaurant',
          address: businessId === '3' ? 'Cardif Avenue, Milton Park, Harare, Zimbabwe' : 'Msasa Park, Harare, Zimbabwe',
          phone: businessId === '3' ? '463685' : '44655566M',
          website: null,
          description: businessId === '3' ? 'Fashion Pokice - Clothing' : 'Flava Restaurant - Restaurant'
        };
        
        setBusiness(mockBusiness);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessData();
  }, [businessId]);

  const handleBackToMap = () => {
    navigate("/dashboard"); // Navigate back to the main dashboard with map
  };

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
          <Button onClick={handleBackToMap}>
            <ArrowLeft size={16} />
            Back to Map
          </Button>
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
        {/* Header with Back Arrow, Business Name + Info Icon, Cart, and Notifications */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToMap}
              className={styles.backButton}
              aria-label="Back to Map"
            >
              <ArrowLeft size={20} />
            </Button>
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
          
          <div className={styles.headerRight}>
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className={styles.cartButton}
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={20} />
            </Button>
          </div>
        </header>

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
