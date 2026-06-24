export type GeolocationStatus = "idle" | "loading" | "ready" | "denied" | "error";

export type GeolocationState = {
  canAskAgain: boolean;
  city: string | null;
  cityLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  status: GeolocationStatus;
};
