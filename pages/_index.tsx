import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { useAuth } from "../helpers/useAuth";
import { AuthLoadingState } from "../components/AuthLoadingState";
import { Zap, CheckCircle } from "lucide-react";
import styles from "./_index.module.css";

const IndexPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for registration success message in URL
    const urlParams = new URLSearchParams(location.search);
    const message = urlParams.get('message');
    const role = urlParams.get('role');
    
    if (message === 'registration-success') {
      if (role === 'business') {
        setSuccessMessage('Agent Seller registration successful! Your application is pending admin approval. You will be notified once approved.');
      } else if (role === 'user') {
        setSuccessMessage('Agent Buyer registration successful! Your application is pending admin approval. You will be notified once approved.');
      }
      
      // Clear the URL parameters
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (authState.type === "authenticated") {
      const { user } = authState;
      // Redirect to role-specific dashboard
      switch (user.role) {
        case "admin":
          navigate("/admin-dashboard", { replace: true });
          break;
        case "business":
          navigate("/business-dashboard", { replace: true });
          break;
        case "user":
        default:
          navigate("/user-dashboard", { replace: true });
          break;
      }
    }
  }, [authState, navigate]);

  if (authState.type === "loading") {
    return <AuthLoadingState title="Checking session..." />;
  }

  return (
    <>
      <Helmet>
        <title>Login | Wazza Agent Platform</title>
        <meta name="description" content="Log in to your Wazza agent account." />
      </Helmet>
      <div className={styles.pageContainer}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <div className={styles.brandIcon}>
              <Zap size={48} />
            </div>
            <h1 className={styles.brandName}>Wazza</h1>
          </div>

          {successMessage && (
            <div className={styles.successMessage}>
              <CheckCircle size={20} />
              <p>{successMessage}</p>
            </div>
          )}

          <PasswordLoginForm />

          <div className={styles.signupSection}>
            <p className={styles.signupText}>
              New to Wazza?{" "}
              <Link to="/register" className={styles.signupLink}>
                Register as Agent
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;