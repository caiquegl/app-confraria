import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { formatRelativeTime } from "@/pages/home/services/feed.service";

import type { AppNotification } from "../types/notifications.types";

type NotificationApiItem = {
  eventId: string | null;
  id: string;
  type: AppNotification["type"];
  postId: string | null;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type NotificationsApiResponse = {
  new: NotificationApiItem[];
  previous: NotificationApiItem[];
};

function mapNotification(item: NotificationApiItem): AppNotification {
  return {
    eventId: item.eventId,
    id: item.id,
    message: item.message,
    postId: item.postId,
    read: item.read,
    time: formatRelativeTime(item.createdAt),
    title: item.title,
    type: item.type,
  };
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await api.get<{ count: number }>(apiRoutes.notifications.unreadCount);
  return response.data.count;
}

export async function fetchNotifications(): Promise<{
  newNotifications: AppNotification[];
  oldNotifications: AppNotification[];
}> {
  const response = await api.get<NotificationsApiResponse>(apiRoutes.notifications.list);

  return {
    newNotifications: response.data.new.map(mapNotification),
    oldNotifications: response.data.previous.map(mapNotification),
  };
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch(apiRoutes.notifications.readAll);
}
