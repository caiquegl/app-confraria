import { io, type Socket } from "socket.io-client";

import type {
  ChatConversation,
  ChatMessage,
  ChatReactionUpdatePayload,
  ChatTypingPayload,
  ChatUnreadPayload,
  MessageReadPayload,
} from "@/pages/messages/types/messages.types";

import { getApiBaseUrl, subscribeApiEnvironment } from "./api-environment";
import { getToken } from "./auth";

type ChatErrorPayload = {
  clientMessageId?: string;
  message: string;
};

type MessageSendAck =
  | ChatMessage
  | {
      error: {
        clientMessageId?: string;
        message: string;
      };
    };

type MessageListener = (message: ChatMessage) => void;
type ConversationListener = (conversation: ChatConversation) => void;
type ReactionListener = (payload: ChatReactionUpdatePayload) => void;
type ReadListener = (payload: MessageReadPayload) => void;
type UnreadListener = (payload: ChatUnreadPayload) => void;
type ErrorListener = (payload: ChatErrorPayload) => void;
type TypingListener = (payload: ChatTypingPayload) => void;

const SEND_ACK_TIMEOUT_MS = 15_000;

let socket: Socket | null = null;
let unsubscribeEnvironment: (() => void) | null = null;

const messageListeners = new Set<MessageListener>();
const conversationListeners = new Set<ConversationListener>();
const reactionListeners = new Set<ReactionListener>();
const readListeners = new Set<ReadListener>();
const unreadListeners = new Set<UnreadListener>();
const errorListeners = new Set<ErrorListener>();
const typingListeners = new Set<TypingListener>();

export async function connectMessagesSocket(): Promise<void> {
  if (socket?.connected) return;

  await createSocket();
}

export async function disconnectMessagesSocket(): Promise<void> {
  unsubscribeEnvironment?.();
  unsubscribeEnvironment = null;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function joinChatConversation(conversationId: string): void {
  socket?.emit("conversation:join", { conversationId });
}

export function sendSocketMessage(params: {
  clientMessageId: string;
  conversationId?: string;
  recipientId?: string;
  replyToMessageId?: string;
  sharedPostId?: string;
  text: string;
}): Promise<ChatMessage> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Chat desconectado"));
      return;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("Tempo esgotado ao enviar mensagem"));
    }, SEND_ACK_TIMEOUT_MS);

    socket.emit("message:send", params, (ack: MessageSendAck) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (!ack || typeof ack !== "object") {
        reject(new Error("Resposta inválida do servidor"));
        return;
      }

      if ("error" in ack && ack.error) {
        reject(new Error(ack.error.message || "Não foi possível enviar a mensagem"));
        return;
      }

      if (!("id" in ack) || typeof ack.id !== "string") {
        reject(new Error("Resposta inválida do servidor"));
        return;
      }

      resolve(ack);
    });
  });
}

export function emitSocketTyping(params: {
  conversationId: string;
  isTyping: boolean;
}): void {
  socket?.emit("conversation:typing", params);
}

export function sendSocketReaction(params: {
  emoji: string;
  messageId: string;
}): void {
  socket?.emit("message:react", params);
}

export function markSocketConversationRead(conversationId: string): void {
  socket?.emit("conversation:read", { conversationId });
}

export function subscribeSocketMessage(listener: MessageListener): () => void {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
}

export function subscribeSocketConversation(
  listener: ConversationListener,
): () => void {
  conversationListeners.add(listener);
  return () => conversationListeners.delete(listener);
}

export function subscribeSocketReaction(listener: ReactionListener): () => void {
  reactionListeners.add(listener);
  return () => reactionListeners.delete(listener);
}

export function subscribeSocketRead(listener: ReadListener): () => void {
  readListeners.add(listener);
  return () => readListeners.delete(listener);
}

export function subscribeSocketUnread(listener: UnreadListener): () => void {
  unreadListeners.add(listener);
  return () => unreadListeners.delete(listener);
}

export function subscribeSocketError(listener: ErrorListener): () => void {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

export function subscribeSocketTyping(listener: TypingListener): () => void {
  typingListeners.add(listener);
  return () => typingListeners.delete(listener);
}

async function createSocket(): Promise<void> {
  await disconnectMessagesSocket();

  const baseUrl = await getApiBaseUrl();
  const token = await getToken();

  if (!token) return;

  socket = io(`${baseUrl}/chat`, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    transports: ["websocket"],
  });

  socket.on("message:new", (message: ChatMessage) => {
    messageListeners.forEach((listener) => listener(message));
  });
  socket.on("conversation:update", (conversation: ChatConversation) => {
    conversationListeners.forEach((listener) => listener(conversation));
  });
  socket.on("message:reaction:update", (payload: ChatReactionUpdatePayload) => {
    reactionListeners.forEach((listener) => listener(payload));
  });
  socket.on("message:read", (payload: MessageReadPayload) => {
    readListeners.forEach((listener) => listener(payload));
  });
  socket.on("chat:unread-count", (payload: ChatUnreadPayload) => {
    unreadListeners.forEach((listener) => listener(payload));
  });
  socket.on("chat:error", (payload: ChatErrorPayload) => {
    errorListeners.forEach((listener) => listener(payload));
  });
  socket.on("conversation:typing", (payload: ChatTypingPayload) => {
    typingListeners.forEach((listener) => listener(payload));
  });

  unsubscribeEnvironment = subscribeApiEnvironment(async () => {
    await createSocket();
  });
}
