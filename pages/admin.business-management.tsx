import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AdminBusinessManagement } from "../components/AdminBusinessManagement";
import styles from "./admin.business-management.module.css";

const AdminBusinessManagementPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Business Management - Admin Dashboard - Floot</title>
        <meta name="description" content="Manage business registrations, approvals, and accounts." />
      </Helmet>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/admin-dashboard" className={styles.breadcrumbLink}>
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
        </nav>
        <AdminBusinessManagement />
      </div>
    </>
  );
};

export default AdminBusinessManagementPage;