export type EventDetailPlace = {
  description: string;
  latitude: number;
  longitude: number;
  mainText: string;
  placeId: string;
  role: string;
  secondaryText: string | null;
};

export type EventDetail = {
  category: string;
  coverImageUrl: string | null;
  createdAt: string;
  date: string;
  description: string | null;
  endTime: string | null;
  galleryImageUrls: string[];
  id: string;
  included: string[];
  isFavorited: boolean;
  isOwner: boolean;
  organizer: {
    avatarUrl: string | null;
    id: string;
    name: string;
  };
  participantLimit: number | null;
  places: EventDetailPlace[];
  requirements: string[];
  routeDistanceMeters: number | null;
  routeDurationSeconds: number | null;
  startTime: string | null;
  title: string;
};
