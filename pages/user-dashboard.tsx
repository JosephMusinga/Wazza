import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { useBusinessProfile } from "../helpers/useBusinessProfile";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User as UserIcon,
  MapPin,
  Package,
  Menu,
  Settings,
  Zap,
  ShoppingCart,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { Button } from "../components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { NotificationBell } from "../components/NotificationBell";
import { Separator } from "../components/Separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { BusinessMap } from "../components/BusinessMap";
import { UserOrderTracking } from "../components/UserOrderTracking";
import { ShoppingCart as ShoppingCartComponent } from "../components/ShoppingCart";
import { useShoppingCart } from "../helpers/useShoppingCart";
import { Business } from "../endpoints/businesses_GET.schema";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "../components/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "../components/Dialog";

import styles from "./user-dashboard.module.css";

const UserDashboardPage: React.FC = () => {
  const { authState, logout } = useAuth();
  const { totalItems, cartForBusiness } = useShoppingCart();
  const navigate = useNavigate();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  
  // Get business profile for business users to exclude their own business from the map
  const { data: businessProfileData } = useBusinessProfile();
  
  // Determine the business ID to exclude (for Agent Sellers)
  const excludeBusinessId = authState.type === "authenticated" && 
    authState.user.role === "business" && 
    businessProfileData && 
    'businessProfile' in businessProfileData 
    ? businessProfileData.businessProfile.id 
    : undefined;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleProfile = () => {
    navigate("/user/profile");
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

  // Get cart items for selected business only
  const selectedBusinessCartItems = selectedBusiness 
    ? Object.values(cartForBusiness(selectedBusiness.id))
    : [];
  const selectedBusinessTotalItems = selectedBusinessCartItems.reduce(
    (sum, item) => sum + item.quantity, 
    0
  );

  if (authState.type !== "authenticated") {
    // This should be handled by ProtectedRoute, but as a fallback
    return null;
  }

  const { user } = authState;
  const fallback =
    user.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2) || "U";

  return (
    <>
      <Helmet>
        <title>User Dashboard - Floot</title>
        <meta name="description" content="Your personal dashboard." />
      </Helmet>
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.userInfo}>
            {selectedBusiness ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBackToMap}
                className={styles.backButton}
              >
                <ArrowLeft className={styles.zapIcon} />
              </Button>
            ) : (
              <Zap className={styles.zapIcon} />
            )}
            <div>
              <h1 className={styles.brandName}>Wazza</h1>
              <div className={styles.userName}>
                {user.displayName}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {selectedBusiness && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className={styles.cartButton}>
                    <ShoppingCart size={20} />
                    {selectedBusinessTotalItems > 0 && (
                      <Badge className={styles.cartBadge}>
                        {selectedBusinessTotalItems > 9 ? '9+' : selectedBusinessTotalItems}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
              <DialogContent className={styles.cartDialog}>
                <ShoppingCartComponent selectedBusiness={selectedBusiness} />
              </DialogContent>
              </Dialog>
            )}
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
                <DropdownMenuSeparator />
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
            {selectedBusiness ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBackToMap}
                className={styles.backButton}
              >
                <ArrowLeft className={styles.zapIcon} />
              </Button>
            ) : (
              <Zap className={styles.zapIcon} />
            )}
            <div>
              <div className={styles.brandName}>Wazza</div>
              <div className={styles.mobileUserName}>
                {user.displayName}
              </div>
            </div>
          </div>
          <div className={styles.mobileHeaderActions}>
            {selectedBusiness && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className={styles.cartButton}>
                    <ShoppingCart size={20} />
                    {selectedBusinessTotalItems > 0 && (
                      <Badge className={styles.cartBadge}>
                        {selectedBusinessTotalItems > 9 ? '9+' : selectedBusinessTotalItems}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
              <DialogContent className={styles.cartDialog}>
                <ShoppingCartComponent selectedBusiness={selectedBusiness} />
              </DialogContent>
              </Dialog>
            )}
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
                <DropdownMenuSeparator />
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
          {selectedBusiness ? (
            <BusinessMap 
              selectedBusiness={selectedBusiness}
              onBusinessSelect={handleBusinessSelect}
              onBackToMap={handleBackToMap}
              excludeBusinessId={excludeBusinessId}
            />
          ) : (
            <Tabs defaultValue="businesses" className={styles.tabs}>
              <TabsList className={styles.tabsList}>
                <TabsTrigger value="businesses">
                  <ShoppingBag size={16} />
                  Shop & Send Gifts
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <Package size={16} />
                  Gift History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="businesses" className={styles.tabContent}>
                <BusinessMap 
                  selectedBusiness={selectedBusiness}
                  onBusinessSelect={handleBusinessSelect}
                  onBackToMap={handleBackToMap}
                  excludeBusinessId={excludeBusinessId}
                />
              </TabsContent>
              
              <TabsContent value="orders" className={styles.tabContent}>
                <UserOrderTracking />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </>
  );
};

export default UserDashboardPage;