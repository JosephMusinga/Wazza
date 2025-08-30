import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { Button } from "./Button";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Skeleton } from "./Skeleton";
import { LogIn, Menu, X, Zap } from "lucide-react";
import styles from "./SharedLayout.module.css";

export const SharedLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authState, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const renderAuthControls = () => {
    switch (authState.type) {
      case "loading":
        return (
          <div className={styles.authControls}>
            <Skeleton style={{ width: "80px", height: "2.5rem" }} />
            <Skeleton
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "var(--radius-full)",
              }}
            />
          </div>
        );
      case "authenticated":
        return (
          <div className={styles.authControls}>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
            <Link to="/dashboard" title="Go to Dashboard">
              <Avatar>
                <AvatarImage
                  src={authState.user.avatarUrl || ""}
                  alt={authState.user.displayName}
                />
                <AvatarFallback>
                  {getInitials(authState.user.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        );
      case "unauthenticated":
        return (
          <div className={styles.authControls}>
            {!isLoginPage && (
              <Button asChild variant="ghost">
                <Link to="/">
                  <LogIn size={16} /> Log In
                </Link>
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <Zap size={24} />
            <span>Wazza</span>
          </Link>
          <nav className={styles.nav}>
            {authState.type === "authenticated" && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ""}`
                }
              >
                Dashboard
              </NavLink>
            )}
          </nav>
          <div className={styles.headerActions}>
            {renderAuthControls()}
            {!(authState.type === "unauthenticated" && isLoginPage) && (
              <Button
                variant="ghost"
                size="icon-md"
                className={styles.mobileMenuButton}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            )}
          </div>
        </div>
        {isMobileMenuOpen && !(authState.type === "unauthenticated" && isLoginPage) && (
          <div className={styles.mobileMenu}>
            <nav className={styles.mobileNav}>
              {authState.type === "authenticated" && (
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.active : ""}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
              )}
            </nav>
            {authState.type === "unauthenticated" && !isLoginPage && (
              <div className={styles.mobileAuthControls}>
                <Button asChild variant="ghost" size="lg">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogIn size={16} /> Log In
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Wazza. All rights reserved.</p>
      </footer>
    </div>
  );
};