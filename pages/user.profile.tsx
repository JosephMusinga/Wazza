import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserProfile } from '../components/UserProfile';
import styles from './user.profile.module.css';

const UserProfilePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>My Profile - Floot</title>
        <meta name="description" content="Manage your personal information and profile settings." />
      </Helmet>
      <div className={styles.page}>
        <header className={styles.header}>
          <Link to="/user-dashboard" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>
            View and edit your personal information below.
          </p>
        </header>
        <main className={styles.content}>
          <UserProfile />
        </main>
      </div>
    </>
  );
};

export default UserProfilePage;