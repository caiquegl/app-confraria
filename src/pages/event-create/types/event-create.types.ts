export type EventCategory = {
  id: string;
  name: string;
};

export type EventDraft = {
  category: string;
  date: string;
  description: string;
  destination: string;
  endTime: string;
  gallery: string[];
  hasParticipantLimit: boolean;
  image: string;
  included: string[];
  location: string;
  maxParticipants?: number;
  requirements: string[];
  startTime: string;
  stops: string[];
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
  destination: string | null;
  endTime: string | null;
  galleryUris: string[];
  hasParticipantLimit: boolean;
  included: string[];
  location: string;
  maxParticipants: number | null;
  requirements: string[];
  startTime: string | null;
  stops: string[];
  title: string;
  userId: string;
};
