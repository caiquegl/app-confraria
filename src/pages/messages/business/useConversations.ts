import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";

import {
  connectMessagesSocket,
  subscribeSocketConversation,
  subscribeSocketUnread,
} from "@/lib/messages-socket";
import { setStoredMessagesUnreadCount } from "@/lib/messages-badge-store";

import {
  createChatConversation,
  fetchChatConversations,
} from "../services/messages.service";
import type {
  ChatContact,
  ChatConversation,
} from "../types/messages.types";

export function useConversations() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const upsertConversation = useCallback((conversation: ChatConversation) => {
    setConversations((current) => {
      const withoutConversation = current.filter((item) => item.id !== conversation.id);
      return [conversation, ...withoutConversation].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
    setContacts((current) =>
      current.map((contact) =>
        contact.userId === conversation.participant.userId
          ? { ...contact, conversationId: conversation.id }
          : contact,
      ),
    );
  }, []);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchChatConversations();
      setConversations(data.conversations);
      setContacts(data.contacts);
      setStoredMessagesUnreadCount(data.unreadCount);
    } catch {
      setError("Não foi possível carregar suas conversas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openOrCreateConversation = useCallback(
    async (contact: ChatContact): Promise<string | null> => {
      if (contact.conversationId) return contact.conversationId;

      try {
        const conversation = await createChatConversation(contact.userId);
        upsertConversation(conversation);
        return conversation.id;
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao abrir conversa",
          text2: "Não foi possível iniciar a conversa.",
        });
        return null;
      }
    },
    [upsertConversation],
  );

  useFocusEffect(
    useCallback(() => {
      const unsubscribeConversation = subscribeSocketConversation(upsertConversation);
      const unsubscribeUnread = subscribeSocketUnread(({ unreadCount }) => {
        setStoredMessagesUnreadCount(unreadCount);
      });

      queueMicrotask(() => {
        void connectMessagesSocket();
        void loadConversations();
      });

      return () => {
        unsubscribeConversation();
        unsubscribeUnread();
      };
    }, [loadConversations, upsertConversation]),
  );

  return {
    contacts,
    conversations,
    error,
    isLoading,
    openOrCreateConversation,
    refresh: loadConversations,
  };
}
