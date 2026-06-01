export type FeedPostType =
  | "event_attended"
  | "event_liked"
  | "photo_shared"
  | "route_completed";

export type FeedComment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  createdAt: string;
};

export type FeedPost = {
  id: string;
  type: FeedPostType;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  createdAt: string;
  eventId?: string;
  eventTitle?: string;
  eventImage?: string;
  routeId?: string;
  routeTitle?: string;
  routeDistanceKm?: number;
  photos?: string[];
  caption?: string;
  audience?: "all" | "friends";
  attachedRouteId?: string;
  attachedRouteTitle?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  comments: FeedComment[];
};

export type FeedInteraction = {
  liked: boolean;
  extraComments: FeedComment[];
};

export type FeedLikeResponse = {
  liked: boolean;
  likeCount: number;
};

export type ComposeAudience = "all" | "friends";

export type FeedShareFriend = {
  id: string;
  userId: string;
  firstName: string;
  avatar: string;
  location?: string;
  isFriend: boolean;
  isPremium: boolean;
};

export type FeedPostsPage = {
  data: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
};
