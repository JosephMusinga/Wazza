import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { RoleSelection } from "../components/RoleSelection";
import { UserRegisterForm } from "../components/UserRegisterForm";
import { BusinessRegisterForm } from "../components/BusinessRegisterForm";
import { useAuth } from "../helpers/useAuth";
import { AuthLoadingState } from "../components/AuthLoadingState";
import styles from "./register.module.css";
import { User } from "../helpers/User";

type RegistrationStep = "role-selection" | "user-form" | "business-form";

const RegisterPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("role-selection");

  const handleSuccessfulRegister = (user: User) => {
    switch (user.role) {
      case "admin":
        navigate("/admin-dashboard");
        break;
      case "business":
        // Agent Sellers need admin approval before accessing dashboard
        navigate("/?message=registration-success&role=business");
        break;
      case "user":
        // Agent Buyers need admin approval before accessing dashboard
        navigate("/?message=registration-success&role=user");
        break;
      default:
        navigate("/"); // Fallback
    }
  };

  const handleRoleSelect = (role: "user" | "business") => {
    if (role === "user") {
      setCurrentStep("user-form");
    } else {
      setCurrentStep("business-form");
    }
  };

  const handleBackToRoleSelection = () => {
    setCurrentStep("role-selection");
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
        <title>Register as Agent - Wazza</title>
        <meta
          name="description"
          content="Register as an Agent Buyer or Agent Seller to join the Wazza platform."
        />
      </Helmet>
      <div className={styles.container}>
        {currentStep === "role-selection" && (
          <RoleSelection onRoleSelect={handleRoleSelect} />
        )}
        
        {currentStep === "user-form" && (
          <UserRegisterForm
            onBack={handleBackToRoleSelection}
            onRegisterSuccess={handleSuccessfulRegister}
          />
        )}
        
        {currentStep === "business-form" && (
          <BusinessRegisterForm
            onBack={handleBackToRoleSelection}
            onRegisterSuccess={handleSuccessfulRegister}
          />
        )}
      </div>
    </>
  );
};

export default RegisterPage;