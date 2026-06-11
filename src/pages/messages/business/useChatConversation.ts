import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";

import {
  connectMessagesSocket,
  joinChatConversation,
  markSocketConversationRead,
  sendSocketMessage,
  sendSocketReaction,
  subscribeSocketError,
  subscribeSocketMessage,
  subscribeSocketReaction,
  subscribeSocketRead,
  subscribeSocketUnread,
} from "@/lib/messages-socket";
import { setStoredMessagesUnreadCount } from "@/lib/messages-badge-store";

import { fetchChatMessages } from "../services/messages.service";
import type { ChatMessage } from "../types/messages.types";

export function useChatConversation(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchChatMessages(conversationId);
      setMessages(data);
      markSocketConversationRead(conversationId);
    } catch {
      setError("Não foi possível carregar a conversa.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(
    (text: string, options?: { replyToMessageId?: string }) => {
      const trimmedText = text.trim();
      if (!trimmedText) return;

      sendSocketMessage({
        conversationId,
        replyToMessageId: options?.replyToMessageId,
        text: trimmedText,
      });
    },
    [conversationId],
  );

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    sendSocketReaction({ emoji, messageId });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribeMessage = subscribeSocketMessage((message) => {
        if (message.conversationId !== conversationId) return;

        appendMessage(message);

        if (!message.isMine) {
          markSocketConversationRead(conversationId);
        }
      });
      const unsubscribeRead = subscribeSocketRead((payload) => {
        if (payload.conversationId !== conversationId) return;

        setMessages((current) =>
          current.map((message) =>
            payload.messageIds.includes(message.id)
              ? { ...message, readAt: payload.readAt }
              : message,
          ),
        );
      });
      const unsubscribeReaction = subscribeSocketReaction((payload) => {
        if (payload.conversationId !== conversationId) return;

        setMessages((current) =>
          current.map((message) =>
            message.id === payload.messageId
              ? {
                  ...message,
                  myReaction: payload.myReaction,
                  reactions: payload.reactions,
                }
              : message,
          ),
        );
      });
      const unsubscribeUnread = subscribeSocketUnread(({ unreadCount }) => {
        setStoredMessagesUnreadCount(unreadCount);
      });
      const unsubscribeError = subscribeSocketError(({ message }) => {
        Toast.show({
          type: "error",
          text1: "Erro no chat",
          text2: message,
        });
      });

      queueMicrotask(() => {
        void connectMessagesSocket().then(() => {
          joinChatConversation(conversationId);
          markSocketConversationRead(conversationId);
        });
        void loadMessages();
      });

      return () => {
        unsubscribeMessage();
        unsubscribeReaction();
        unsubscribeRead();
        unsubscribeUnread();
        unsubscribeError();
      };
    }, [appendMessage, conversationId, loadMessages]),
  );

  return {
    error,
    isLoading,
    messages,
    reactToMessage,
    refresh: loadMessages,
    sendMessage,
  };
}
