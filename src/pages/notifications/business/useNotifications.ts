import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

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
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const hasAttemptedRef = useRef(false);
  const hasDataRef = useRef(false);

  const reload = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const hasData = hasDataRef.current;
    if (hasAttemptedRef.current && !hasData) {
      setIsRetrying(true);
    } else if (!hasData) {
      setIsLoading(true);
    }

    try {
      const data = await fetchNotifications();
      setNewNotifications(data.newNotifications);
      setOldNotifications(data.oldNotifications);
      setError(null);
      hasDataRef.current = true;
      await markAllNotificationsRead();
      setStoredUnreadCount(0);
    } catch {
      if (hasData) {
        Toast.show({
          type: "error",
          text1: "Não foi possível atualizar as notificações",
          text2: "Mantivemos a lista anterior.",
        });
      } else {
        setError("Não foi possível carregar as notificações.");
      }
    } finally {
      hasAttemptedRef.current = true;
      inFlightRef.current = false;
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    error,
    hasUnread: newNotifications.length > 0,
    isLoading,
    isRetrying,
    newNotifications,
    oldNotifications,
    reload,
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
