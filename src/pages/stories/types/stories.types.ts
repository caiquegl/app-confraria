export type StoryItem = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  image: string;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
  viewerCount: number;
  isMine: boolean;
};

export type StoryGroup = {
  userId: string;
  userName: string;
  userAvatar: string | null;
  isMine: boolean;
  stories: StoryItem[];
};

export type StoriesFeed = {
  currentUser: {
    userId: string;
    userName: string;
    userAvatar: string | null;
  };
  groups: StoryGroup[];
};

export type StoryViewerUser = {
  userId: string;
  userName: string;
  userAvatar: string | null;
  viewedAt: string;
};
