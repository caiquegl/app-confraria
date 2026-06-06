export type OwnProfileBikeCategory = {
  id: string;
  name: string;
};

export type OwnProfile = {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string | null;
  location: string | null;
  cpf: string | null;
  bio: string | null;
  phone: string | null;
  showEmail: boolean;
  showPhone: boolean;
  isPublicProfile: boolean;
  isVerified: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  bikeCategories: OwnProfileBikeCategory[];
};

export type UpdateProfilePayload = {
  name: string;
  email: string;
  location: string;
  cpf: string;
  bio: string;
  phone: string;
  avatarUri?: string | null;
  bikeCategoryIds?: string[];
};

export type UpdateContactVisibilityPayload = {
  showEmail: boolean;
  showPhone: boolean;
  isPublicProfile: boolean;
};
