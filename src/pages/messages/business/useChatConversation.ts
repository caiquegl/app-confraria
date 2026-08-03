import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import { getCurrentUserId } from "@/lib/auth";
import {
  connectMessagesSocket,
  emitSocketTyping,
  joinChatConversation,
  markSocketConversationRead,
  sendSocketMessage,
  sendSocketReaction,
  subscribeSocketError,
  subscribeSocketMessage,
  subscribeSocketReaction,
  subscribeSocketRead,
  subscribeSocketTyping,
  subscribeSocketUnread,
} from "@/lib/messages-socket";
import { setStoredMessagesUnreadCount } from "@/lib/messages-badge-store";

import { fetchChatMessages } from "../services/messages.service";
import type { ChatMessage, ChatReplyMessage } from "../types/messages.types";

const PEER_TYPING_TIMEOUT_MS = 3000;

function createClientMessageId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function withDeliveredStatus(message: ChatMessage): ChatMessage {
  return {
    ...message,
    sendStatus: message.isMine ? (message.sendStatus ?? "delivered") : undefined,
  };
}

function messagesMatch(left: ChatMessage, right: ChatMessage): boolean {
  if (left.id === right.id) return true;

  const leftClientId = left.clientMessageId;
  const rightClientId = right.clientMessageId;
  return Boolean(leftClientId && rightClientId && leftClientId === rightClientId);
}

function mergeIncomingMessage(
  current: ChatMessage[],
  incoming: ChatMessage,
): ChatMessage[] {
  const nextIncoming = withDeliveredStatus(incoming);
  const existingIndex = current.findIndex((item) => messagesMatch(item, nextIncoming));

  if (existingIndex === -1) {
    return [...current, nextIncoming];
  }

  const existing = current[existingIndex];
  const merged: ChatMessage = {
    ...existing,
    ...nextIncoming,
    clientMessageId: nextIncoming.clientMessageId ?? existing.clientMessageId,
    sendStatus: nextIncoming.isMine ? "delivered" : existing.sendStatus,
  };

  const next = [...current];
  next[existingIndex] = merged;
  return next;
}

export function useChatConversation(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const currentUserIdRef = useRef<string | null>(null);

  const clearPeerTypingTimeout = useCallback(() => {
    if (peerTypingTimeoutRef.current) {
      clearTimeout(peerTypingTimeoutRef.current);
      peerTypingTimeoutRef.current = null;
    }
  }, []);

  const markPeerTyping = useCallback(
    (isTyping: boolean) => {
      clearPeerTypingTimeout();

      if (!isTyping) {
        setIsPeerTyping(false);
        return;
      }

      setIsPeerTyping(true);
      peerTypingTimeoutRef.current = setTimeout(() => {
        setIsPeerTyping(false);
        peerTypingTimeoutRef.current = null;
      }, PEER_TYPING_TIMEOUT_MS);
    },
    [clearPeerTypingTimeout],
  );

  const upsertMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => {
      const next = mergeIncomingMessage(current, message);
      messagesRef.current = next;
      return next;
    });
  }, []);

  const replaceLocalMessage = useCallback(
    (clientMessageId: string, updater: (message: ChatMessage) => ChatMessage) => {
      setMessages((current) => {
        const next = current.map((message) =>
          message.clientMessageId === clientMessageId || message.id === clientMessageId
            ? updater(message)
            : message,
        );
        messagesRef.current = next;
        return next;
      });
    },
    [],
  );

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchChatMessages(conversationId);
      const next = data.map((message) => withDeliveredStatus(message));
      messagesRef.current = next;
      setMessages(next);
      markSocketConversationRead(conversationId);
    } catch {
      setError("Não foi possível carregar a conversa.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const dispatchMessage = useCallback(
    async (params: {
      clientMessageId: string;
      replyToMessageId?: string;
      text: string;
    }) => {
      try {
        emitSocketTyping({ conversationId, isTyping: false });
        const serverMessage = await sendSocketMessage({
          clientMessageId: params.clientMessageId,
          conversationId,
          replyToMessageId: params.replyToMessageId,
          text: params.text,
        });

        replaceLocalMessage(params.clientMessageId, (current) => ({
          ...current,
          ...withDeliveredStatus(serverMessage),
          clientMessageId: params.clientMessageId,
          sendStatus: "delivered",
        }));
      } catch {
        replaceLocalMessage(params.clientMessageId, (current) => ({
          ...current,
          sendStatus: "failed",
        }));
      }
    },
    [conversationId, replaceLocalMessage],
  );

  const sendMessage = useCallback(
    (text: string, options?: { replyToMessageId?: string; replyToMessage?: ChatReplyMessage | null }) => {
      const trimmedText = text.trim();
      if (!trimmedText) return;

      const clientMessageId = createClientMessageId();
      const optimisticMessage: ChatMessage = {
        clientMessageId,
        conversationId,
        createdAt: new Date().toISOString(),
        id: `local:${clientMessageId}`,
        isMine: true,
        myReaction: null,
        reactions: [],
        readAt: null,
        replyToMessage: options?.replyToMessage ?? null,
        sendStatus: "sending",
        senderId: currentUserIdRef.current ?? "me",
        sharedEvent: null,
        sharedPost: null,
        sharedRoute: null,
        text: trimmedText,
      };

      setMessages((current) => {
        const next = [...current, optimisticMessage];
        messagesRef.current = next;
        return next;
      });

      void dispatchMessage({
        clientMessageId,
        replyToMessageId: options?.replyToMessageId,
        text: trimmedText,
      });
    },
    [conversationId, dispatchMessage],
  );

  const retryFailedMessage = useCallback(
    (messageId: string) => {
      const target = messagesRef.current.find(
        (message) =>
          message.id === messageId || message.clientMessageId === messageId,
      );

      if (!target || !target.isMine || target.sendStatus !== "failed") return;

      const clientMessageId = target.clientMessageId ?? createClientMessageId();

      replaceLocalMessage(target.clientMessageId ?? target.id, (current) => ({
        ...current,
        clientMessageId,
        sendStatus: "sending",
      }));

      void dispatchMessage({
        clientMessageId,
        replyToMessageId: target.replyToMessage?.id,
        text: target.text,
      });
    },
    [dispatchMessage, replaceLocalMessage],
  );

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      emitSocketTyping({ conversationId, isTyping });
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

        if (!message.isMine) {
          markPeerTyping(false);
          markSocketConversationRead(conversationId);
        }

        upsertMessage(message);
      });
      const unsubscribeRead = subscribeSocketRead((payload) => {
        if (payload.conversationId !== conversationId) return;

        setMessages((current) => {
          const next = current.map((message) =>
            payload.messageIds.includes(message.id)
              ? { ...message, readAt: payload.readAt, sendStatus: "delivered" as const }
              : message,
          );
          messagesRef.current = next;
          return next;
        });
      });
      const unsubscribeReaction = subscribeSocketReaction((payload) => {
        if (payload.conversationId !== conversationId) return;

        setMessages((current) => {
          const next = current.map((message) =>
            message.id === payload.messageId
              ? {
                  ...message,
                  myReaction: payload.myReaction,
                  reactions: payload.reactions,
                }
              : message,
          );
          messagesRef.current = next;
          return next;
        });
      });
      const unsubscribeUnread = subscribeSocketUnread(({ unreadCount }) => {
        setStoredMessagesUnreadCount(unreadCount);
      });
      const unsubscribeTyping = subscribeSocketTyping((payload) => {
        if (payload.conversationId !== conversationId) return;
        if (
          currentUserIdRef.current &&
          payload.userId === currentUserIdRef.current
        ) {
          return;
        }
        markPeerTyping(payload.isTyping);
      });
      const unsubscribeError = subscribeSocketError(({ clientMessageId, message }) => {
        if (clientMessageId) {
          replaceLocalMessage(clientMessageId, (current) => ({
            ...current,
            sendStatus: "failed",
          }));
          return;
        }

        Toast.show({
          type: "error",
          text1: "Erro no chat",
          text2: message,
        });
      });

      queueMicrotask(() => {
        void getCurrentUserId().then((userId) => {
          currentUserIdRef.current = userId;
        });
        void connectMessagesSocket().then(() => {
          joinChatConversation(conversationId);
          markSocketConversationRead(conversationId);
        });
        void loadMessages();
      });

      return () => {
        clearPeerTypingTimeout();
        emitSocketTyping({ conversationId, isTyping: false });
        unsubscribeMessage();
        unsubscribeReaction();
        unsubscribeRead();
        unsubscribeUnread();
        unsubscribeTyping();
        unsubscribeError();
      };
    }, [
      clearPeerTypingTimeout,
      conversationId,
      loadMessages,
      markPeerTyping,
      replaceLocalMessage,
      upsertMessage,
    ]),
  );

  return {
    error,
    isLoading,
    isPeerTyping,
    messages,
    notifyTyping,
    reactToMessage,
    refresh: loadMessages,
    retryFailedMessage,
    sendMessage,
  };
}
