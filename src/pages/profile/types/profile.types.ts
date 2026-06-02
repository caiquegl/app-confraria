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
  isVerified: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export type UpdateProfilePayload = {
  name: string;
  email: string;
  location: string;
  cpf: string;
  bio: string;
  phone: string;
  avatarUri?: string | null;
};
