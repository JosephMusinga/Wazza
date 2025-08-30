import React from 'react';
import { Helmet } from 'react-helmet';
import { UserCheckout } from '../components/UserCheckout';
import styles from './user-checkout-demo.module.css';

const UserCheckoutDemoPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>User Checkout Demo | Floot</title>
        <meta
          name="description"
          content="A demonstration page for the UserCheckout component." />

      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>UserCheckout Component Demo</h1>
          <p className={styles.description}>
            This page showcases the `UserCheckout` component, a multi-step
            process for purchasing items for oneself or as a gift. The component
            below is initialized with a sample business ID (`businessId=1`).
          </p>
        </header>
        <main className={styles.mainContent}>
          <UserCheckout businessId={1} />
        </main>
      </div>
    </>);

};

export default UserCheckoutDemoPage;