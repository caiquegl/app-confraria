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
