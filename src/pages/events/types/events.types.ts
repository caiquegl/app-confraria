export type EventsLocationStatus = "idle" | "loading" | "ready" | "denied" | "error";

export type EventsLocationState = {
  canAskAgain: boolean;
  city: string | null;
  cityLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  status: EventsLocationStatus;
};

export type EventsFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};
