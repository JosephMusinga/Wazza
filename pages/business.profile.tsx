import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BusinessProfile } from '../components/BusinessProfile';
import styles from './business.profile.module.css';

const BusinessProfilePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Business Profile - Wazza</title>
        <meta name="description" content="Manage your business information and profile settings." />
      </Helmet>
      <div className={styles.page}>
        <header className={styles.header}>
          <Link to="/business-dashboard" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className={styles.title}>Business Profile</h1>
          <p className={styles.subtitle}>
            Manage your business information and personal details.
          </p>
        </header>
        <main className={styles.content}>
          <BusinessProfile />
        </main>
      </div>
    </>
  );
};

export default BusinessProfilePage;

