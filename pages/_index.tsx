import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { useAuth } from "../helpers/useAuth";
import { AuthLoadingState } from "../components/AuthLoadingState";
import { Zap } from "lucide-react";
import styles from "./_index.module.css";

const IndexPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

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
        <title>Login | React Role-Based Auth</title>
        <meta name="description" content="Log in to your account." />
      </Helmet>
      <div className={styles.pageContainer}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <div className={styles.brandIcon}>
              <Zap size={48} />
            </div>
            <h1 className={styles.brandName}>Wazza</h1>
          </div>

          

          <PasswordLoginForm />

          <div className={styles.signupSection}>
            <p className={styles.signupText}>
              Don't have an account?{" "}
              <Link to="/register" className={styles.signupLink}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;