import React from "react";
import { BusinessSharedLayout } from '../components/BusinessSharedLayout';

export default function BusinessProductsPageLayout({ children }: { children: React.ReactNode }) {
  return <BusinessSharedLayout>{children}</BusinessSharedLayout>;
}
