import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  ChatConversation,
  ChatConversationsResponse,
  ChatMessage,
  ChatReactionUpdatePayload,
} from "../types/messages.types";

export async function fetchChatConversations(): Promise<ChatConversationsResponse> {
  const { data } = await api.get<ChatConversationsResponse>(
    apiRoutes.chat.conversations,
  );
  return data;
}

export async function createChatConversation(
  targetUserId: string,
): Promise<ChatConversation> {
  const { data } = await api.post<ChatConversation>(apiRoutes.chat.conversations, {
    targetUserId,
  });
  return data;
}

export async function fetchChatMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(
    apiRoutes.chat.messages(conversationId),
  );
  return data;
}

export async function sendChatMessage(params: {
  conversationId?: string;
  recipientId?: string;
  replyToMessageId?: string;
  sharedEventId?: string;
  sharedPostId?: string;
  sharedRouteId?: string;
  text: string;
}): Promise<{ message: ChatMessage; senderConversation: ChatConversation }> {
  const { data } = await api.post<{
    message: ChatMessage;
    senderConversation: ChatConversation;
  }>(apiRoutes.chat.sendMessage, params);
  return data;
}

export async function reactToChatMessage(params: {
  emoji: string;
  messageId: string;
}): Promise<ChatReactionUpdatePayload> {
  const { data } = await api.post<ChatReactionUpdatePayload>(
    apiRoutes.chat.messageReaction(params.messageId),
    { emoji: params.emoji },
  );
  return data;
}

export async function markChatConversationRead(
  conversationId: string,
): Promise<void> {
  await api.patch(apiRoutes.chat.conversationRead(conversationId));
}

export async function fetchChatUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>(apiRoutes.chat.unreadCount);
  return data.count;
}
