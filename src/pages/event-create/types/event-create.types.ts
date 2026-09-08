export type EventCategory = {
  id: string;
  name: string;
};

export type EventPlaceReference = {
  description: string;
  latitude?: number;
  longitude?: number;
  mainText: string;
  placeId: string;
  reference: string;
  secondaryText: string;
  types: string[];
};

export type EventDraft = {
  category: string;
  description: string;
  destination: EventPlaceReference | null;
  endDate: string;
  endTime: string;
  gallery: string[];
  hasParticipantLimit: boolean;
  image: string;
  included: string[];
  location: EventPlaceReference | null;
  maxParticipants?: number;
  requirements: string[];
  startDate: string;
  startTime: string;
  stops: (EventPlaceReference | null)[];
  title: string;
};

export type EventDraftUpdate = <K extends keyof EventDraft>(
  key: K,
  value: EventDraft[K],
) => void;

export type EventCreatePayload = {
  category: string;
  coverImageUri: string | null;
  /** @deprecated Dual-accept alias for startDate. */
  date: string;
  description: string | null;
  destination: EventPlaceReference | null;
  endDate: string;
  endTime: string | null;
  galleryUris: string[];
  hasParticipantLimit: boolean;
  included: string[];
  location: EventPlaceReference | null;
  maxParticipants: number | null;
  requirements: string[];
  startDate: string;
  startTime: string | null;
  stops: EventPlaceReference[];
  title: string;
  userId: string;
};

export type EventCreateResponse = {
  category: string;
  createdAt: string;
  date: string;
  description: string | null;
  endsAt?: string;
  id: string;
  included: string[];
  images: {
    kind: string;
    order: number;
    url: string;
  }[];
  places: {
    description: string;
    latitude: number;
    longitude: number;
    placeId: string;
    role: string;
  }[];
  requirements: string[];
  routeDistanceMeters: number | null;
  routeDurationSeconds: number | null;
  startsAt?: string;
  title: string;
};
