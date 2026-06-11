export type ChatUser = {
  userId: string;
  userName: string;
  userAvatar: string | null;
};

export type ChatSharedPost = {
  postId: string;
  authorName: string;
  caption: string | null;
  thumbnail: string | null;
};

export type ChatSharedEvent = {
  eventId: string;
  category: string;
  organizerName: string;
  thumbnail: string | null;
  title: string;
};

export type ChatReplyMessage = {
  id: string;
  senderId: string;
  senderName: string;
  sharedType: "event" | "post" | null;
  text: string;
};

export type ChatReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
  sharedPost: ChatSharedPost | null;
  sharedEvent: ChatSharedEvent | null;
  replyToMessage: ChatReplyMessage | null;
  reactions: ChatReactionSummary[];
  myReaction: string | null;
};

export type ChatConversation = {
  id: string;
  participant: ChatUser;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
};

export type ChatContact = ChatUser & {
  conversationId: string | null;
};

export type ChatConversationsResponse = {
  conversations: ChatConversation[];
  contacts: ChatContact[];
  unreadCount: number;
};

export type MessageReadPayload = {
  conversationId: string;
  messageIds: string[];
  readAt: string;
};

export type ChatUnreadPayload = {
  unreadCount: number;
};

export type ChatReactionUpdatePayload = {
  conversationId: string;
  messageId: string;
  reactions: ChatReactionSummary[];
  myReaction: string | null;
};
