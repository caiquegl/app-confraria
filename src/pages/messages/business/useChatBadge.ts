import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  connectMessagesSocket,
  subscribeSocketUnread,
} from "@/lib/messages-socket";
import {
  getStoredMessagesUnreadCount,
  setStoredMessagesUnreadCount,
  subscribeStoredMessagesUnreadCount,
} from "@/lib/messages-badge-store";

import { fetchChatUnreadCount } from "../services/messages.service";

export function useChatBadge(): { hasUnread: boolean; unreadCount: number } {
  const [unreadCount, setUnreadCount] = useState(getStoredMessagesUnreadCount());

  useEffect(() => subscribeStoredMessagesUnreadCount(setUnreadCount), []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchChatUnreadCount();
      setStoredMessagesUnreadCount(count);
    } catch {
      // Mantém o último valor conhecido se a API falhar.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribeUnread = subscribeSocketUnread(({ unreadCount: count }) => {
        setStoredMessagesUnreadCount(count);
      });

      queueMicrotask(() => {
        void refreshUnreadCount();
        void connectMessagesSocket();
      });

      return unsubscribeUnread;
    }, [refreshUnreadCount]),
  );

  return {
    hasUnread: unreadCount > 0,
    unreadCount,
  };
}
