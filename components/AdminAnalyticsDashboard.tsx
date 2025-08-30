import { useState } from "react";
import { useAdminAnalytics } from "../helpers/useAdminAnalytics";
import { TopProduct } from "../endpoints/admin/analytics_GET.schema";
import { AlertTriangle, BarChart2, Briefcase, DollarSign, ShoppingCart, Users } from "lucide-react";
import { Skeleton } from "./Skeleton";
import { Badge } from "./Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import styles from "./AdminAnalyticsDashboard.module.css";

type DateRangePreset = "all" | "7d" | "30d" | "90d";

const MetricCard = ({ title, value, icon, isLoading }: { title: string; value: string | number; icon: React.ReactNode; isLoading: boolean }) => (
  <div className={styles.metricCard}>
    {isLoading ? (
      <>
        <Skeleton style={{ width: '80%', height: '1.25rem', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '50%', height: '2rem' }} />
        <div className={styles.metricIcon}>
          <Skeleton style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-full)' }} />
        </div>
      </>
    ) : (
      <>
        <h3 className={styles.metricTitle}>{title}</h3>
        <p className={styles.metricValue}>{value}</p>
        <div className={styles.metricIcon}>{icon}</div>
      </>
    )}
  </div>
);

const TopProductsCard = ({ products, isLoading }: { products: TopProduct[], isLoading: boolean }) => (
  <div className={styles.listCard}>
    <div className={styles.listCardHeader}>
      <ShoppingCart size={18} />
      <h3 className={styles.listCardTitle}>Top Selling Products</h3>
    </div>
    <div className={styles.listCardContent}>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.productItem}>
            <Skeleton style={{ flex: 1, height: '1.2rem' }} />
            <Skeleton style={{ width: '40px', height: '1.2rem' }} />
          </div>
        ))
      ) : products.length > 0 ? (
        products.map((product) => (
          <div key={product.productId} className={styles.productItem}>
            <span className={styles.productName}>{product.productName}</span>
            <Badge variant="secondary">{product.salesCount} sales</Badge>
          </div>
        ))
      ) : (
        <p className={styles.noDataText}>No product sales data available for this period.</p>
      )}
    </div>
  </div>
);

export const AdminAnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRangePreset>("all");

  const getDatesFromPreset = (preset: DateRangePreset): { startDate?: Date; endDate?: Date } => {
    const endDate = new Date();
    let startDate: Date | undefined = undefined;
    if (preset !== "all") {
      startDate = new Date();
      const days = parseInt(preset.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);
    }
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDatesFromPreset(dateRange);
  const { data, isFetching, isError, error } = useAdminAnalytics({ startDate, endDate });

  const analyticsData = data && "totalActiveUsers" in data ? data : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (isError) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle size={48} className={styles.errorIcon} />
        <h2 className={styles.errorTitle}>Failed to load analytics</h2>
        <p className={styles.errorMessage}>{error instanceof Error ? error.message : "An unknown error occurred."}</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <BarChart2 size={28} />
          <h1 className={styles.title}>Platform Analytics</h1>
        </div>
        <Select onValueChange={(value) => setDateRange(value as DateRangePreset)} defaultValue="all">
          <SelectTrigger className={styles.dateRangeSelector}>
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={styles.metricsGrid}>
        <MetricCard
          title="Total Sales Volume"
          value={formatCurrency(analyticsData?.totalSalesVolume ?? 0)}
          icon={<DollarSign size={24} />}
          isLoading={isFetching}
        />
        <MetricCard
          title="Active Users"
          value={analyticsData?.totalActiveUsers ?? 0}
          icon={<Users size={24} />}
          isLoading={isFetching}
        />
        <MetricCard
          title="Active Businesses"
          value={analyticsData?.totalActiveBusinesses ?? 0}
          icon={<Briefcase size={24} />}
          isLoading={isFetching}
        />
        <MetricCard
          title="Pending Businesses"
          value={analyticsData?.totalPendingBusinesses ?? 0}
          icon={<Briefcase size={24} />}
          isLoading={isFetching}
        />
      </div>

      <div className={styles.chartsGrid}>
        <TopProductsCard products={analyticsData?.topProducts ?? []} isLoading={isFetching} />
      </div>
    </div>
  );
};