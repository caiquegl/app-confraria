export type NotificationType =
  | "post_like"
  | "post_comment"
  | "comment_reply"
  | "comment_like"
  | "follow_request"
  | "event_updated"
  | "event_cancelled"
  | "quick_ride_updated"
  | "quick_ride_cancelled";

export type AppNotification = {
  eventId: string | null;
  quickRideId: string | null;
  id: string;
  type: NotificationType;
  postId: string | null;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export type NotificationsViewProps = {
  onBack: () => void;
  onOpenEvent: (eventId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenQuickRide: (quickRideId: string) => void;
};

export type UseNotificationsResult = {
  error: string | null;
  hasUnread: boolean;
  isLoading: boolean;
  newNotifications: AppNotification[];
  oldNotifications: AppNotification[];
  unreadCount: number;
};
