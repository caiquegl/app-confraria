export type PublicProfileEventTab = "Inscrito" | "Criados";

export type PublicProfileEvent = {
  id: string;
  category: string;
  date: string;
  description?: string;
  endsAt: string;
  image: string;
  isFavorited: boolean;
  location: string;
  organizer: string;
  organizerAvatar?: string;
  rating: number;
  reviews: number;
  startsAt: string;
  title: string;
};

export type PublicProfileEventListItem = {
  category: string;
  createdAt: string;
  date: string;
  description: string | null;
  endsAt?: string;
  id: string;
  image: string | null;
  isFavorited: boolean;
  latitude: number | null;
  location: string | null;
  longitude: number | null;
  organizer: {
    avatarUrl: string | null;
    id: string;
    name: string;
  };
  region: string | null;
  routeDistanceMeters: number | null;
  routeDurationSeconds: number | null;
  startsAt?: string;
  title: string;
};

export type PublicProfileEventFavoriteResponse = {
  eventId: string;
  favorited: boolean;
};
