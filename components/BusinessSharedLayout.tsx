import React, { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { useBusinessProfile } from "../helpers/useBusinessProfile";
import { Button } from "./Button";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { LogIn, Menu, X, Zap, Settings, LogOut, ArrowLeft, ShoppingBag, BarChart2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./DropdownMenu";
import { NotificationBell } from "./NotificationBell";
import styles from "./BusinessSharedLayout.module.css";

export const BusinessSharedLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  // Get business profile data
  const { data: businessProfileData, isLoading: isLoadingProfile, error: profileError } = useBusinessProfile();

  // Determine current page and header configuration
  const isMapPage = location.pathname === "/user-dashboard";
  const isProductsPage = location.pathname.startsWith("/business-products");
  const isBusinessDashboard = location.pathname === "/business-dashboard";
  const isBusinessUser = authState.type === "authenticated" && authState.user.role === "business";

  // Determine header configuration
  const getHeaderConfig = () => {
    // Products page: Show back button for ALL users (both regular and business)
    if (isProductsPage) {
      return {
        showBusinessInfo: false,
        showBackButton: true,
        showLightning: false,
        compactMode: true,
        backButtonTarget: "/user-dashboard"
      };
    }

    // Business user specific configurations
    if (isBusinessUser) {
      if (isBusinessDashboard) {
        return {
          showBusinessInfo: true,
          showBackButton: false,
          showLightning: true,
          compactMode: false,
          backButtonTarget: null
        };
      }

      if (isMapPage) {
        return {
          showBusinessInfo: false,
          showBackButton: true,
          showLightning: false,
          compactMode: true,
          backButtonTarget: "/business-dashboard"
        };
      }
    }

    // Default for regular users and other pages
    return {
      showBusinessInfo: false,
      showBackButton: false,
      showLightning: true,
      compactMode: false,
      backButtonTarget: null
    };
  };

  const headerConfig = getHeaderConfig();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleBackButton = () => {
    if (headerConfig.backButtonTarget) {
      navigate(headerConfig.backButtonTarget);
    }
  };

  const renderAuthControls = () => {
    switch (authState.type) {
      case "unauthenticated":
        return (
          <Button asChild variant="outline" size="sm">
            <Link to="/login">
              <LogIn size={16} />
              Sign In
            </Link>
          </Button>
        );
      case "authenticated":
        const user = authState.user;
        const fallback = getInitials(user.displayName || user.email);
        
        return (
          <div className={styles.authControls}>
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
                {/* Add navigation options based on current page and user role */}
                {user.role === "business" ? (
                  <>
                    {location.pathname === "/business-dashboard" ? (
                      <DropdownMenuItem onClick={() => navigate("/user-dashboard")}>
                        <ShoppingBag size={16} />
                        Shop
                      </DropdownMenuItem>
                    ) : (location.pathname === "/user-dashboard" || location.pathname === "/business-products") ? (
                      <DropdownMenuItem onClick={() => navigate("/business-dashboard")}>
                        <BarChart2 size={16} />
                        Dashboard
                      </DropdownMenuItem>
                    ) : null}
                  </>
                ) : (
                  <>
                    {(location.pathname === "/user-dashboard" || location.pathname === "/business-products") && (
                      <DropdownMenuItem onClick={() => navigate("/user-dashboard")}>
                        <BarChart2 size={16} />
                        Dashboard
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
    }
  };

  if (authState.type === "unauthenticated" && isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.layout}>
      <header className={`${styles.header} ${headerConfig.compactMode ? styles.compactHeader : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.userInfo}>
            {headerConfig.showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackButton}
                className={styles.backButton}
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </Button>
            ) : headerConfig.showLightning ? (
              <Zap className={styles.zapIcon} />
            ) : null}
            <div>
              <h1 className={styles.brandName}>Wazza</h1>
              {headerConfig.showBusinessInfo && (
                <>
                  <div className={styles.userName}>
                    {isLoadingProfile ? (
                      <Skeleton style={{ width: '150px', height: '1.2rem' }} />
                    ) : profileError ? (
                      'Business Profile Error'
                    ) : businessProfileData && 'businessProfile' in businessProfileData ? (
                      businessProfileData.businessProfile.businessName
                    ) : (
                      'Loading Business...'
                    )}
                  </div>
                  {isLoadingProfile ? (
                    <Skeleton style={{ width: '200px', height: '1rem', marginTop: 'var(--spacing-1)' }} />
                  ) : profileError ? (
                    <span className={styles.userAddress}>Unable to load business address</span>
                  ) : businessProfileData && 'businessProfile' in businessProfileData && businessProfileData.businessProfile.address ? (
                    <span className={styles.userAddress}>{businessProfileData.businessProfile.address}</span>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className={styles.headerActions}>
            {renderAuthControls()}
          </div>
        </div>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};
