import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  CheckCircle,
  XCircle,
  PauseCircle,
  Ban,
} from "lucide-react";
import {
  BusinessAdminView,
  OutputType as GetBusinessesOutputType,
} from "../endpoints/admin/businesses_GET.schema";
import { useDebounce } from "../helpers/useDebounce";
import {
  useAdminBusinesses,
  useAdminApproveBusiness,
  useAdminRejectBusiness,
  useAdminSuspendBusiness,
  useAdminBanBusiness,
} from "../helpers/useAdminBusinessManagement";
import { BusinessStatus, BusinessStatusArrayValues } from "../helpers/schema";
import { Button } from "./Button";
import { Input } from "./Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import styles from "./AdminBusinessManagement.module.css";

type ActionType = "approve" | "reject" | "suspend" | "ban";

const isSuccessResponse = (data: GetBusinessesOutputType): data is { businesses: BusinessAdminView[]; pagination: any } => {
  return 'businesses' in data;
};

const ACTION_CONFIG: Record<
  ActionType,
  {
    label: string;
    icon: React.ElementType;
    variant: "destructive" | "primary" | "secondary";
    description: (name: string) => string;
  }
> = {
  approve: {
    label: "Approve",
    icon: CheckCircle,
    variant: "primary",
    description: (name) => `Are you sure you want to approve ${name}? Their business will become active.`,
  },
  reject: {
    label: "Reject",
    icon: XCircle,
    variant: "destructive",
    description: (name) => `Are you sure you want to reject ${name}? This will mark their application as rejected.`,
  },
  suspend: {
    label: "Suspend",
    icon: PauseCircle,
    variant: "secondary",
    description: (name) => `Are you sure you want to suspend ${name}? They will be temporarily unable to operate.`,
  },
  ban: {
    label: "Ban",
    icon: Ban,
    variant: "destructive",
    description: (name) => `Are you sure you want to ban ${name}? This action is permanent.`,
  },
};

export const AdminBusinessManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BusinessStatus | "all">("all");
  const [actionBusiness, setActionBusiness] = useState<BusinessAdminView | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, debouncedSearch, status]
  );

  const { data: businessesData, isFetching, error } = useAdminBusinesses(queryParams);

  const approveMutation = useAdminApproveBusiness();
  const rejectMutation = useAdminRejectBusiness();
  const suspendMutation = useAdminSuspendBusiness();
  const banMutation = useAdminBanBusiness();

  const handleActionClick = (business: BusinessAdminView, type: ActionType) => {
    setActionBusiness(business);
    setActionType(type);
  };

  const handleConfirmAction = () => {
    if (!actionBusiness || !actionType) return;

    const mutations = {
      approve: approveMutation,
      reject: rejectMutation,
      suspend: suspendMutation,
      ban: banMutation,
    };

    mutations[actionType].mutate({ businessId: actionBusiness.id });
    setActionBusiness(null);
    setActionType(null);
  };

  const renderStatusBadge = (status: BusinessStatus) => {
    const variantMap: Record<BusinessStatus, "success" | "warning" | "destructive" | "default" | "secondary"> = {
      active: "success",
      pending: "warning",
      suspended: "secondary",
      banned: "destructive",
      rejected: "destructive",
    };
    return (
      <Badge variant={variantMap[status]} className={styles.statusBadge}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderBusinessActions = (business: BusinessAdminView) => {
    const actions: ActionType[] = [];
    if (business.status === "pending") {
      actions.push("approve", "reject");
    } else if (business.status === "active") {
      actions.push("suspend", "ban");
    }
    
    if (actions.length === 0) {
        return <span className={styles.noActionsText}>No actions available</span>;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((type) => {
            const config = ACTION_CONFIG[type];
            return (
              <DropdownMenuItem
                key={type}
                onClick={() => handleActionClick(business, type)}
                className={styles.dropdownMenuItem}
              >
                <config.icon className={styles.actionIcon} />
                <span>{config.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderContent = () => {
    if (isFetching && !businessesData) {
      return (
        <tbody>
          {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i}>
              <td colSpan={5}>
                <Skeleton className={styles.skeletonRow} />
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (error) {
      return (
        <tbody>
          <tr>
            <td colSpan={5} className={styles.errorState}>
              <AlertTriangle />
              <p>{error instanceof Error ? error.message : "Failed to load businesses."}</p>
            </td>
          </tr>
        </tbody>
      );
    }

    if (!businessesData || !isSuccessResponse(businessesData)) {
      return (
        <tbody>
          <tr>
            <td colSpan={5} className={styles.errorState}>
              <AlertTriangle />
              <p>No data available.</p>
            </td>
          </tr>
        </tbody>
      );
    }

    const businesses = businessesData.businesses;

    if (businesses.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={5} className={styles.emptyState}>
              <Search />
              <p>No businesses found.</p>
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {businesses.map((business) => (
          <tr key={business.id}>
            <td>
              <div className={styles.businessName}>{business.businessName}</div>
              <div className={styles.businessAddress}>{business.address || 'No address'}</div>
            </td>
            <td>
              <div className={styles.ownerName}>{business.ownerName}</div>
              <div className={styles.ownerEmail}>{business.ownerEmail}</div>
            </td>
            <td>{renderStatusBadge(business.status)}</td>
            <td>{new Date(business.createdAt!).toLocaleDateString()}</td>
            <td className={styles.actionsCell}>{renderBusinessActions(business)}</td>
          </tr>
        ))}
      </tbody>
    );
  };

  const pagination = businessesData && isSuccessResponse(businessesData) ? businessesData.pagination : null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Business Management</h1>
              <div className={styles.workflowInfo}>
          <p><strong>Approval Workflow:</strong></p>
          <ul>
            <li>New businesses start with <strong>"Pending"</strong> status</li>
            <li>Review business details and approve/reject applications</li>
            <li>Only <strong>"Active"</strong> businesses appear on the map for users to shop</li>
            <li>Rejected businesses cannot be reactivated</li>
            <li><strong>Login Restriction:</strong> Pending businesses cannot log in until approved</li>
          </ul>
        </div>
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <Input
            placeholder="Search by business or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as BusinessStatus | "all")}>
          <SelectTrigger className={styles.statusSelect}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {BusinessStatusArrayValues.map(s => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Business</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          {renderContent()}
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className={styles.paginationControls}>
            <Button variant="outline" onClick={() => setPage((p) => p - 1)} disabled={pagination.page <= 1}>
              <ChevronLeft /> Previous
            </Button>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={pagination.page >= pagination.totalPages}>
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {actionBusiness && actionType && (
        <Dialog open={!!actionBusiness} onOpenChange={(open) => !open && setActionBusiness(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ACTION_CONFIG[actionType].label} Business</DialogTitle>
              <DialogDescription>
                {ACTION_CONFIG[actionType].description(actionBusiness.businessName)}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant={ACTION_CONFIG[actionType].variant}
                onClick={handleConfirmAction}
                disabled={
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  suspendMutation.isPending ||
                  banMutation.isPending
                }
              >
                {approveMutation.isPending || rejectMutation.isPending || suspendMutation.isPending || banMutation.isPending
                  ? "Processing..."
                  : `Confirm ${ACTION_CONFIG[actionType].label}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};