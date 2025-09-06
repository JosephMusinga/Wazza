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
        <h1 className={styles.title}>Choose Your Agent Role</h1>
        <p className={styles.subtitle}>
          Select the type of agent account that best describes your role
        </p>
      </div>

      <div className={styles.roleCards}>
        <div className={styles.roleCard}>
          <div className={styles.roleIcon}>
            <User size={48} />
          </div>
          <h2 className={styles.roleTitle}>Agent Buyer</h2>
          <p className={styles.roleDescription}>
            Shop exclusively on behalf of regular people who don't have app access. Send gifts to recipients who collect from Agent Sellers' businesses.
          </p>
          <ul className={styles.roleFeatures}>
            <li>Gift-only shopping (no personal purchases)</li>
            <li>Shop on behalf of regular people</li>
            <li>Track gift orders and history</li>
            <li>Recipients collect from businesses</li>
            <li>Receive SMS notifications</li>
          </ul>
          <Button
            onClick={() => onRoleSelect("user")}
            className={styles.selectButton}
            size="lg"
          >
            Register as Agent Buyer
          </Button>
        </div>

        <div className={styles.roleCard}>
          <div className={styles.roleIcon}>
            <Store size={48} />
          </div>
          <h2 className={styles.roleTitle}>Agent Seller</h2>
          <p className={styles.roleDescription}>
            Partner with a real business in our Wazza X Business collaboration. You'll manage products for your business AND also shop from other businesses as an Agent Buyer.
          </p>
          <ul className={styles.roleFeatures}>
            <li>Partner with one business only</li>
            <li>Manage products for your business</li>
            <li>Fulfill gift orders from customers</li>
            <li>Shop from other businesses (excluding your own)</li>
            <li>Dual role: Business manager + Agent Buyer</li>
          </ul>
          <Button
            onClick={() => onRoleSelect("business")}
            className={styles.selectButton}
            size="lg"
          >
            Register as Agent Seller
          </Button>
        </div>
      </div>
    </div>
  );
};

