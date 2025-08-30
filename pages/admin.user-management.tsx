import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AdminUserManagement } from "../components/AdminUserManagement";
import styles from "./admin.user-management.module.css";

const AdminUserManagementPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>User Management - Floot Admin</title>
        <meta
          name="description"
          content="Manage all users in the system."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <nav aria-label="Breadcrumb">
            <ol className={styles.breadcrumbs}>
              <li>
                <Link to="/admin-dashboard" className={styles.breadcrumbLink}>
                  Dashboard
                </Link>
              </li>
              <li>
                <ChevronRight size={16} className={styles.breadcrumbSeparator} />
              </li>
              <li>
                <span
                  className={styles.breadcrumbCurrent}
                  aria-current="page"
                >
                  User Management
                </span>
              </li>
            </ol>
          </nav>
          <h1 className={styles.pageTitle}>User Management</h1>
        </header>
        <main className={styles.mainContent}>
          <AdminUserManagement />
        </main>
      </div>
    </>
  );
};

export default AdminUserManagementPage;