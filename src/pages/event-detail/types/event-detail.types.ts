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
  isParticipant: boolean;
  organizer: {
    avatarUrl: string | null;
    id: string;
    name: string;
  };
  participantLimit: number | null;
  participantsCount: number;
  places: EventDetailPlace[];
  requirements: string[];
  remainingSpots: number | null;
  routeDistanceMeters: number | null;
  routeDurationSeconds: number | null;
  startTime: string | null;
  title: string;
};

export type EventParticipationResponse = {
  eventId: string;
  isParticipant: boolean;
  participantsCount: number;
  remainingSpots: number | null;
};
