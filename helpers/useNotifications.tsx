import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getNotifications, GetNotificationsInputType } from "../endpoints/notifications_GET.schema";
import { postNotificationsMarkRead, InputType as MarkReadInputType } from "../endpoints/notifications/mark-read_POST.schema";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];
export const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"];

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam = 1 }) => getNotifications({ page: pageParam, limit: 10, filter: 'all' }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    placeholderData: (d) => d,
  });

  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: () => getNotifications({ page: 1, limit: 1, filter: 'unread' }),
    select: (data) => data.total,
    staleTime: 15 * 1000, // 15 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    placeholderData: (d) => d,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (input: MarkReadInputType) => postNotificationsMarkRead(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Failed to mark notifications as read:", error);
      // Optionally show a toast notification
    },
  });

  const markOneAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationIds: [notificationId] });
  };

  const markAllAsRead = () => {
    markAsReadMutation.mutate({ markAllAsRead: true });
  };

  const notifications = data?.pages.flatMap(page => page.notifications) ?? [];

  return {
    notifications,
    unreadCount: unreadCountData ?? 0,
    isLoading: isFetching && !isFetchingNextPage,
    isFetchingNextPage,
    hasNextPage,
    error: error as Error | null,
    fetchNextPage,
    refetch,
    refetchUnreadCount,
    markOneAsRead,
    markAllAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};