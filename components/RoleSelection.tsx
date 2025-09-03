import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { User, Store, ArrowLeft } from "lucide-react";
import styles from "./RoleSelection.module.css";

interface RoleSelectionProps {
  onRoleSelect: (role: "user" | "business") => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={20} />
          Back to Login
        </Link>
        <h1 className={styles.title}>Choose Your Account Type</h1>
        <p className={styles.subtitle}>
          Select the type of account that best describes you
        </p>
      </div>

      <div className={styles.roleCards}>
        <div className={styles.roleCard}>
          <div className={styles.roleIcon}>
            <User size={48} />
          </div>
          <h2 className={styles.roleTitle}>Individual User</h2>
          <p className={styles.roleDescription}>
            Create an account to browse products, place orders, and manage your personal profile.
          </p>
          <ul className={styles.roleFeatures}>
            <li>Browse and order products</li>
            <li>Track your orders</li>
            <li>Manage your profile</li>
            <li>Receive notifications</li>
          </ul>
          <Button
            onClick={() => onRoleSelect("user")}
            className={styles.selectButton}
            size="lg"
          >
            Register as User
          </Button>
        </div>

        <div className={styles.roleCard}>
          <div className={styles.roleIcon}>
            <Store size={48} />
          </div>
          <h2 className={styles.roleTitle}>Business Owner</h2>
          <p className={styles.roleDescription}>
            Register your business to sell products, manage inventory, and grow your customer base.
          </p>
          <ul className={styles.roleFeatures}>
            <li>List and manage products</li>
            <li>Process customer orders</li>
            <li>Track business analytics</li>
            <li>Manage business profile</li>
          </ul>
          <Button
            onClick={() => onRoleSelect("business")}
            className={styles.selectButton}
            size="lg"
          >
            Register as Business
          </Button>
        </div>
      </div>
    </div>
  );
};

