import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { useBusinessProfile } from "../helpers/useBusinessProfile";
import { useNavigate } from "react-router-dom";
import { Business } from "../endpoints/businesses_GET.schema";
import { LogOut, BarChart2, Menu, User, Zap, Settings, ShoppingBag } from "lucide-react";
import { Button } from "../components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { NotificationBell } from "../components/NotificationBell";
import { Separator } from "../components/Separator";
import { Skeleton } from "../components/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import { BusinessOrderManagement } from "../components/BusinessOrderManagement";
import { BusinessProductManagement } from "../components/BusinessProductManagement";
import { BusinessMap } from "../components/BusinessMap";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "../components/DropdownMenu";

import styles from "./business-dashboard.module.css";

const BusinessDashboardPage: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const { data: businessProfileData, isFetching: isLoadingProfile, error: profileError } = useBusinessProfile();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleProfile = () => {
    console.log("Profile clicked");
  };

  const handleSettings = () => {
    console.log("Settings clicked");
  };

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
  };

  const handleBackToMap = () => {
    setSelectedBusiness(null);
  };



  if (authState.type !== "authenticated") {
    return null;
  }

  const { user } = authState;
  
  // Only allow business users to access business dashboard
  if (user.role !== "business") {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>This dashboard is only available for business users (Agent Sellers).</p>
        <p>You are currently logged in as a {user.role} user.</p>
        <p>Please register as an Agent Seller to access this dashboard.</p>
      </div>
    );
  }
  const fallback =
    user.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2) || "B";

  return (
    <>
      <Helmet>
        <title>Business Dashboard - Floot</title>
        <meta name="description" content="Manage your business." />
      </Helmet>
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <Zap className={styles.zapIcon} />
            <div>
              <h1 className={styles.brandName}>Wazza</h1>
              <div className={styles.userName}>
                {isLoadingProfile ? (
                  <Skeleton style={{ width: '150px', height: '1.2rem' }} />
                ) : profileError ? (
                  user.displayName
                ) : businessProfileData && 'businessProfile' in businessProfileData ? (
                  businessProfileData.businessProfile.businessName
                ) : (
                  user.displayName
                )}
              </div>
              {isLoadingProfile ? (
                <Skeleton style={{ width: '200px', height: '1rem', marginTop: 'var(--spacing-1)' }} />
              ) : profileError ? (
                <span className={styles.userAddress}>Unable to load business address</span>
              ) : businessProfileData && 'businessProfile' in businessProfileData && businessProfileData.businessProfile.address ? (
                <span className={styles.userAddress}>{businessProfileData.businessProfile.address}</span>
              ) : null}
            </div>
          </div>
          <div className={styles.headerActions}>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleProfile}>
                  <Avatar className={styles.profileAvatar}>
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings size={16} />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <header className={styles.mobileHeader}>
          <div className={styles.mobileUserInfo}>
            <Zap className={styles.zapIcon} />
            <div>
              <div className={styles.brandName}>Wazza</div>
              <div className={styles.mobileUserName}>
                {isLoadingProfile ? (
                  <Skeleton style={{ width: '120px', height: '1rem' }} />
                ) : profileError ? (
                  user.displayName
                ) : businessProfileData && 'businessProfile' in businessProfileData ? (
                  businessProfileData.businessProfile.businessName
                ) : (
                  user.displayName
                )}
              </div>
            </div>
          </div>
          <div className={styles.mobileHeaderActions}>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleProfile}>
                  <Avatar className={styles.profileAvatar}>
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings size={16} />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <Separator className={styles.separator} />

        <main className={styles.mainContent}>
          <Tabs defaultValue="orders" className={styles.tabsContainer}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="shop">
                <ShoppingBag size={16} />
                Buy
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className={styles.tabContent}>
              <BusinessOrderManagement />
            </TabsContent>
            
            <TabsContent value="products" className={styles.tabContent}>
              <BusinessProductManagement />
            </TabsContent>
            
            <TabsContent value="shop" className={styles.tabContent}>
              <div className={styles.placeholderContent}>
                <ShoppingBag className={styles.placeholderIcon} />
                <h3 className={styles.placeholderTitle}>Shop as Agent Buyer</h3>
                <p className={styles.placeholderDescription}>
                  Access the same shopping interface that Agent Buyers use to shop on behalf of regular people.
                  Browse businesses, select products, and send gifts.
                </p>
                <Button 
                  onClick={() => navigate('/user-dashboard')}
                >
                  <ShoppingBag size={16} />
                  Go to Shopping Interface
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className={styles.tabContent}>
              <div className={styles.placeholderContent}>
                <BarChart2 className={styles.placeholderIcon} />
                <h3 className={styles.placeholderTitle}>Sales Analytics</h3>
                <p className={styles.placeholderDescription}>
                  Track your sales performance, revenue trends, and customer insights.
                  Analytics dashboard coming soon.
                </p>
              </div>
            </TabsContent>
            

          </Tabs>
        </main>
      </div>
    </>
  );
};

export default BusinessDashboardPage;