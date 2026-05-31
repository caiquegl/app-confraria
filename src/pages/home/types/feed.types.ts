export type FeedPostType =
  | "event_attended"
  | "event_liked"
  | "photo_shared"
  | "route_completed";

export type FeedComment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
};

export type FeedPost = {
  id: string;
  type: FeedPostType;
  userId: string;
  userName: string;
  userAvatar: string;
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
  comments: FeedComment[];
};

export type FeedInteraction = {
  liked: boolean;
  extraComments: FeedComment[];
};

export type FeedShareFriend = {
  id: string;
  userId: string;
  firstName: string;
  avatar: string;
  location?: string;
  isFriend: boolean;
  isPremium: boolean;
};
