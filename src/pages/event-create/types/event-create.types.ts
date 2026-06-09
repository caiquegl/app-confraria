export type EventCategory = {
  id: string;
  name: string;
};

export type EventPlaceReference = {
  description: string;
  mainText: string;
  placeId: string;
  reference: string;
  secondaryText: string;
  types: string[];
};

export type EventDraft = {
  category: string;
  date: string;
  description: string;
  destination: EventPlaceReference | null;
  endTime: string;
  gallery: string[];
  hasParticipantLimit: boolean;
  image: string;
  included: string[];
  location: EventPlaceReference | null;
  maxParticipants?: number;
  requirements: string[];
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
  date: string;
  description: string | null;
  destination: EventPlaceReference | null;
  endTime: string | null;
  galleryUris: string[];
  hasParticipantLimit: boolean;
  included: string[];
  location: EventPlaceReference | null;
  maxParticipants: number | null;
  requirements: string[];
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
  title: string;
};
