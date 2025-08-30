import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  UserCheck,
  UserX,
  Ban,
} from "lucide-react";
import {
  UserAdminView,
  OutputType as GetUsersOutputType,
} from "../endpoints/admin/users_GET.schema";
import { useDebounce } from "../helpers/useDebounce";
import { useAuth } from "../helpers/useAuth";
import { useAdminUsers, useAdminSuspendUser, useAdminBanUser, useAdminReactivateUser } from "../helpers/useAdminUserManagement";
import { UserRole, UserStatus } from "../helpers/schema";
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
import styles from "./AdminUserManagement.module.css";

type ActionType = "suspend" | "ban" | "reactivate";

// Type guard to check if response is successful
const isSuccessResponse = (data: GetUsersOutputType): data is { users: UserAdminView[]; pagination: { page: number; limit: number; total: number; totalPages: number; } } => {
  return 'users' in data;
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
  suspend: {
    label: "Suspend",
    icon: UserX,
    variant: "secondary",
    description: (name) =>
      `Are you sure you want to suspend ${name}? They will be temporarily unable to log in.`,
  },
  ban: {
    label: "Ban",
    icon: Ban,
    variant: "destructive",
    description: (name) =>
      `Are you sure you want to ban ${name}? This action is permanent and they will not be able to use their account again.`,
  },
  reactivate: {
    label: "Reactivate",
    icon: UserCheck,
    variant: "primary",
    description: (name) =>
      `Are you sure you want to reactivate ${name}? They will regain full access to their account.`,
  },
};

export const AdminUserManagement = () => {
  const { authState } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [actionUser, setActionUser] = useState<UserAdminView | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      role: role === "all" ? undefined : role,
    }),
    [page, debouncedSearch, role]
  );

  const {
    data: usersData,
    isFetching,
    error,
  } = useAdminUsers(queryParams);

  const suspendMutation = useAdminSuspendUser();
  const banMutation = useAdminBanUser();
  const reactivateMutation = useAdminReactivateUser();

  const handleActionClick = (user: UserAdminView, type: ActionType) => {
    setActionUser(user);
    setActionType(type);
  };

  const handleConfirmAction = () => {
    if (!actionUser || !actionType) return;

    const mutations = {
      suspend: suspendMutation,
      ban: banMutation,
      reactivate: reactivateMutation,
    };

    mutations[actionType].mutate({ userId: actionUser.id });
    setActionUser(null);
    setActionType(null);
  };

  const renderStatusBadge = (status: UserStatus) => {
    const variantMap: Record<UserStatus, "success" | "warning" | "destructive"> = {
      active: "success",
      suspended: "warning",
      banned: "destructive",
    };
    return (
      <Badge variant={variantMap[status]} className={styles.statusBadge}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderUserActions = (user: UserAdminView) => {
    const currentUserId = authState.type === 'authenticated' ? authState.user.id : null;
    if (user.id === currentUserId) {
      return <span className={styles.currentUserText}>This is you</span>;
    }

    const actions: ActionType[] = [];
    if (user.status === "active") {
      actions.push("suspend", "ban");
    } else {
      actions.push("reactivate");
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
                onClick={() => handleActionClick(user, type)}
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
    if (isFetching && !usersData) {
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
              <p>
                {error instanceof Error ? error.message : "Failed to load users."}
              </p>
            </td>
          </tr>
        </tbody>
      );
    }

    if (!usersData || !isSuccessResponse(usersData)) {
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

    const users = usersData.users;

    if (users.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={5} className={styles.emptyState}>
              <Search />
              <p>No users found.</p>
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>
              <div className={styles.userCell}>
                <div className={styles.avatar}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} />
                  ) : (
                    <span>{user.displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className={styles.displayName}>{user.displayName}</div>
                  <div className={styles.email}>{user.email}</div>
                </div>
              </div>
            </td>
            <td className={styles.roleCell}>{user.role}</td>
            <td>{renderStatusBadge(user.status)}</td>
            <td>
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </td>
            <td className={styles.actionsCell}>{renderUserActions(user)}</td>
          </tr>
        ))}
      </tbody>
    );
  };

  const pagination = usersData && isSuccessResponse(usersData) ? usersData.pagination : null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>User Management</h1>
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as UserRole | "all")}
        >
          <SelectTrigger className={styles.roleSelect}>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
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
            <Button
              variant="outline"
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {actionUser && actionType && (
        <Dialog
          open={!!actionUser}
          onOpenChange={(open) => !open && setActionUser(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {ACTION_CONFIG[actionType].label} User
              </DialogTitle>
              <DialogDescription>
                {ACTION_CONFIG[actionType].description(actionUser.displayName)}
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
                  suspendMutation.isPending ||
                  banMutation.isPending ||
                  reactivateMutation.isPending
                }
              >
                {suspendMutation.isPending ||
                banMutation.isPending ||
                reactivateMutation.isPending
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