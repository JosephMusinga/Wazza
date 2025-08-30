import React from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { useBusinessProfile } from "../helpers/useBusinessProfile";
import { useNavigate } from "react-router-dom";
import { LogOut, BarChart2, Menu, User, Zap, Settings } from "lucide-react";
import { Button } from "../components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { NotificationBell } from "../components/NotificationBell";
import { Separator } from "../components/Separator";
import { Skeleton } from "../components/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import { BusinessOrderManagement } from "../components/BusinessOrderManagement";
import { BusinessProductManagement } from "../components/BusinessProductManagement";
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



  if (authState.type !== "authenticated") {
    return null;
  }

  const { user } = authState;
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
              <div className={styles.userName}>{user.displayName}</div>
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
              <div className={styles.mobileUserName}>{user.displayName}</div>
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
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className={styles.tabContent}>
              <BusinessOrderManagement />
            </TabsContent>
            
            <TabsContent value="products" className={styles.tabContent}>
              <BusinessProductManagement />
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