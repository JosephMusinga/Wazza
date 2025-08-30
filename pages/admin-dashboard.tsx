import React from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Shield,
  Users,
  Settings,
  Activity,
  Building2,
  BarChart2,
} from "lucide-react";
import { Button } from "../components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Separator } from "../components/Separator";
import { AdminAnalyticsDashboard } from "../components/AdminAnalyticsDashboard";
import styles from "./admin-dashboard.module.css";

const AdminDashboardPage: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleUserManagement = () => {
    navigate("/admin/user-management");
  };

  const handleBusinessManagement = () => {
    navigate("/admin/business-management");
  };

  const handleAnalytics = () => {
    // Scroll to analytics section
    const analyticsSection = document.getElementById("analytics-section");
    if (analyticsSection) {
      analyticsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleComingSoon = () => {
    // Placeholder for future features
    console.log("Feature coming soon");
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
      .substring(0, 2) || "A";

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Floot</title>
        <meta name="description" content="System administration." />
      </Helmet>
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <Avatar>
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className={styles.userName}>{user.displayName}</h1>
              <div className={styles.userMeta}>
                <span className={styles.userEmail}>{user.email}</span>
                <Badge variant="destructive">Admin</Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </Button>
        </header>

        <Separator className={styles.separator} />

        <main className={styles.mainContent}>
          <h2 className={styles.sectionTitle}>System Control</h2>
          <div className={styles.featureGrid}>
            <div 
              className={`${styles.featureCard} ${styles.clickableCard}`}
              onClick={handleAnalytics}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleAnalytics();
                }
              }}
            >
              <BarChart2 className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Platform Analytics</h3>
              <p className={styles.featureDescription}>
                View key metrics, sales data, user activity, and business insights.
              </p>
            </div>
            <div 
              className={`${styles.featureCard} ${styles.clickableCard}`}
              onClick={handleUserManagement}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleUserManagement();
                }
              }}
            >
              <Users className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>User Management</h3>
              <p className={styles.featureDescription}>
                View, edit, and manage all user accounts.
              </p>
            </div>
            <div 
              className={`${styles.featureCard} ${styles.clickableCard}`}
              onClick={handleBusinessManagement}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleBusinessManagement();
                }
              }}
            >
              <Building2 className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Business Management</h3>
              <p className={styles.featureDescription}>
                Review business registrations, approve applications, and manage business accounts.
              </p>
            </div>
            <div 
              className={`${styles.featureCard} ${styles.comingSoonCard}`}
              onClick={handleComingSoon}
            >
              <Shield className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Roles & Permissions</h3>
              <p className={styles.featureDescription}>
                Configure user roles and access levels.
              </p>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
            </div>
            <div 
              className={`${styles.featureCard} ${styles.comingSoonCard}`}
              onClick={handleComingSoon}
            >
              <Settings className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>System Settings</h3>
              <p className={styles.featureDescription}>
                Adjust global application settings and configurations.
              </p>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
            </div>
            <div 
              className={`${styles.featureCard} ${styles.comingSoonCard}`}
              onClick={handleComingSoon}
            >
              <Activity className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>System Activity</h3>
              <p className={styles.featureDescription}>
                Monitor system logs and user activity.
              </p>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
            </div>
          </div>

          <div id="analytics-section" className={styles.analyticsSection}>
            <AdminAnalyticsDashboard />
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboardPage;