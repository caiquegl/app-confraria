export type PublicProfile = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  location: string | null;
  bio: string | null;
  isVerified: boolean;
  isFollowing: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export type FollowProfileResponse = {
  isFollowing: boolean;
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

export type PublicProfileFollowTab = "followers" | "following";
