export type NotificationType = "post_like" | "post_comment";

export type AppNotification = {
  id: string;
  type: NotificationType;
  postId: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export type NotificationsViewProps = {
  onBack: () => void;
  onOpenPost: (postId: string) => void;
};

export type UseNotificationsResult = {
  error: string | null;
  hasUnread: boolean;
  isLoading: boolean;
  newNotifications: AppNotification[];
  oldNotifications: AppNotification[];
  unreadCount: number;
};
