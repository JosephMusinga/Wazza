import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { AuthLoadingState } from "../components/AuthLoadingState";
import { AuthErrorPage } from "../components/AuthErrorPage";

const DashboardPage = () => {
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
    return <AuthLoadingState title="Loading Dashboard..." />;
  }

  if (authState.type === "unauthenticated") {
    return <AuthErrorPage message="You must be logged in to view this page." />;
  }

  // This should not be reached due to the redirect above, but provide fallback
  return (
    <>
      <Helmet>
        <title>Dashboard | React Role-Based Auth</title>
        <meta name="description" content="Redirecting to your dashboard..." />
      </Helmet>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh',
        fontFamily: 'var(--font-family-base)'
      }}>
        <p>Redirecting to your dashboard...</p>
      </div>
    </>
  );
};

export default DashboardPage;