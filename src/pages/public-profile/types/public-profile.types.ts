export type PublicProfileFollowStatus = "none" | "following" | "pending";

export type PublicProfile = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  phone: string | null;
  isVerified: boolean;
  isFollowing: boolean;
  isPrivate: boolean;
  canViewPrivateContent: boolean;
  followStatus: PublicProfileFollowStatus;
  hasPendingFollowRequest: boolean;
  postsCount: number;
  eventsCreatedCount: number;
  eventFavoritesCount: number;
  followersCount: number;
  followingCount: number;
};

export type FollowProfileResponse = {
  isFollowing: boolean;
  followStatus: PublicProfileFollowStatus;
  hasPendingFollowRequest: boolean;
  followersCount: number;
  followingCount: number;
};

export type PublicProfileFollowUser = {
  userId: string;
  name: string;
  avatar: string | null;
  location: string | null;
  isFollowing: boolean;
  isSelf: boolean;
};

export type PublicProfileFollowRequest = {
  requestId: string;
  userId: string;
  name: string;
  avatar: string | null;
  location: string | null;
  requestedAt: string;
};

export type PublicProfileFollowTab = "followers" | "following" | "requests";
