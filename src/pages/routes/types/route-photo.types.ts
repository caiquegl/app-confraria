export type RoutePhoto = {
  createdAt: string;
  id: string;
  latitude: number;
  longitude: number;
  routeId: string;
  url: string;
  userAvatarUrl: string | null;
  userId: string;
  userName: string;
};

export type RoutePhotoCluster = {
  id: string;
  latitude: number;
  longitude: number;
  photos: RoutePhoto[];
};
