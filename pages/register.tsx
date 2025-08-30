import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import { useAuth } from "../helpers/useAuth";
import { AuthLoadingState } from "../components/AuthLoadingState";
import styles from "./register.module.css";
import { User } from "../helpers/User";

const RegisterPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  const handleSuccessfulRegister = (user: User) => {
    switch (user.role) {
      case "admin":
        navigate("/admin-dashboard");
        break;
      case "business":
        navigate("/business-dashboard");
        break;
      case "user":
        navigate("/user-dashboard");
        break;
      default:
        navigate("/"); // Fallback
    }
  };

  if (authState.type === "loading") {
    return <AuthLoadingState title="Checking session..." />;
  }

  if (authState.type === "authenticated") {
    handleSuccessfulRegister(authState.user);
    return <AuthLoadingState title="Redirecting..." />;
  }

  return (
    <>
      <Helmet>
        <title>Create Account - Floot</title>
        <meta
          name="description"
          content="Create a new account to get started."
        />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Create an Account</h1>
            <p className={styles.subtitle}>
              Start your journey with us. Already have an account?{" "}
              <Link to="/" className={styles.link}>
                Log in
              </Link>
            </p>
          </div>
          <PasswordRegisterForm onRegisterSuccess={handleSuccessfulRegister} />
        </div>
      </div>
    </>
  );
};

export default RegisterPage;