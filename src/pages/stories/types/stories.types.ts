export type StoryMediaType = "image" | "video";

export type StoryDraftMedia = {
  uri: string;
  mediaType: StoryMediaType;
  durationMs?: number | null;
};

export type StoryItem = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  image: string;
  mediaType: StoryMediaType;
  durationMs: number | null;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
  isLiked: boolean;
  likeCount: number;
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
  liked: boolean;
  viewedAt: string;
};

export type StoryLikeResponse = {
  liked: boolean;
  likeCount: number;
};
