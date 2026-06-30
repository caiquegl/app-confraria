export type RouteSuggestionType = "gas" | "food" | "sleep" | "viewpoint";

export type RouteStopSuggestion = {
  description: string;
  id: string;
  kmFromDayOrigin: number;
  latitude: number;
  longitude: number;
  name: string;
  photoName: string | null;
  placeId: string;
  rating: number | null;
  type: RouteSuggestionType;
  typeLabel: string;
};

export type RouteDaySuggestionAlert = {
  description: string;
  title: string;
  tone: "info" | "warning";
};

export type RouteDaySuggestionsResponse = {
  alert: RouteDaySuggestionAlert;
  dayId: string;
  hasMore: boolean;
  suggestions: RouteStopSuggestion[];
};

export type RouteDaySuggestionsRequest = {
  bikeRangeKm?: number;
  dayId: string;
  distanceMeters: number;
  encodedPolyline: string;
  excludePlaceIds?: string[];
  limit?: number;
  overnight?: boolean;
};
