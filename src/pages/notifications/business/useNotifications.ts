import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
} from "@/lib/notifications-socket";
import {
  getStoredUnreadCount,
  setStoredUnreadCount,
  subscribeStoredUnreadCount,
} from "@/lib/notifications-badge-store";

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
} from "../services/notifications.service";
import type { AppNotification, UseNotificationsResult } from "../types/notifications.types";

export function useNotifications(): UseNotificationsResult {
  const [newNotifications, setNewNotifications] = useState<AppNotification[]>([]);
  const [oldNotifications, setOldNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchNotifications();
        if (!mounted) return;

        setNewNotifications(data.newNotifications);
        setOldNotifications(data.oldNotifications);
        await markAllNotificationsRead();
        setStoredUnreadCount(0);
      } catch {
        if (!mounted) return;
        setError("Não foi possível carregar as notificações.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    error,
    hasUnread: newNotifications.length > 0,
    isLoading,
    newNotifications,
    oldNotifications,
    unreadCount: newNotifications.length,
  };
}

export function useNotificationBadge(): { hasUnread: boolean; unreadCount: number } {
  const [unreadCount, setUnreadCount] = useState(getStoredUnreadCount());

  useEffect(() => subscribeStoredUnreadCount(setUnreadCount), []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadCount();
      setStoredUnreadCount(count);
    } catch {
      // Mantém o último valor conhecido se a API falhar.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void refreshUnreadCount();

      void connectNotificationsSocket({
        onNewNotification: ({ unreadCount: nextCount }) => {
          if (active) {
            setStoredUnreadCount(nextCount);
          }
        },
      });

      return () => {
        active = false;
        void disconnectNotificationsSocket();
      };
    }, [refreshUnreadCount]),
  );

  return {
    hasUnread: unreadCount > 0,
    unreadCount,
  };
}
