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

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
  sharedPost: ChatSharedPost | null;
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
