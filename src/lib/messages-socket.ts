import { io, type Socket } from "socket.io-client";

import type {
  ChatConversation,
  ChatMessage,
  ChatReactionUpdatePayload,
  ChatUnreadPayload,
  MessageReadPayload,
} from "@/pages/messages/types/messages.types";

import { getApiBaseUrl, subscribeApiEnvironment } from "./api-environment";
import { getToken } from "./auth";

type ChatErrorPayload = {
  message: string;
};

type MessageListener = (message: ChatMessage) => void;
type ConversationListener = (conversation: ChatConversation) => void;
type ReactionListener = (payload: ChatReactionUpdatePayload) => void;
type ReadListener = (payload: MessageReadPayload) => void;
type UnreadListener = (payload: ChatUnreadPayload) => void;
type ErrorListener = (payload: ChatErrorPayload) => void;

let socket: Socket | null = null;
let unsubscribeEnvironment: (() => void) | null = null;

const messageListeners = new Set<MessageListener>();
const conversationListeners = new Set<ConversationListener>();
const reactionListeners = new Set<ReactionListener>();
const readListeners = new Set<ReadListener>();
const unreadListeners = new Set<UnreadListener>();
const errorListeners = new Set<ErrorListener>();

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
  conversationId?: string;
  recipientId?: string;
  replyToMessageId?: string;
  sharedPostId?: string;
  text: string;
}): void {
  socket?.emit("message:send", params);
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

  unsubscribeEnvironment = subscribeApiEnvironment(async () => {
    await createSocket();
  });
}
