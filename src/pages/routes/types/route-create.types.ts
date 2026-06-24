export type SheetState = "compact" | "normal" | "full";

export type WizardStep = 1 | 2 | 3 | 4;

export type RoutePlace = {
  description: string;
  latitude?: number;
  longitude?: number;
  mainText?: string;
  placeId?: string;
  secondaryText?: string;
};

export type RouteDraftStop = {
  id: string;
  place: RoutePlace | null;
};

export type RouteDraftDay = {
  destination: RoutePlace | null;
  id: string;
  label: string;
  origin: RoutePlace | null;
  stops: RouteDraftStop[];
};

export type RouteMotorcycleDraft = {
  bikeId: string | null;
};

export type RoutePreferencesDraft = {
  avoidTolls: boolean;
  optimizeFuel: boolean;
};

export type RouteCreateDraft = {
  itinerary: {
    activeDayId: string;
    days: RouteDraftDay[];
  };
  motorcycle: RouteMotorcycleDraft;
  preferences: RoutePreferencesDraft;
};

export type RouteCreatePlacePayload = {
  description: string;
  latitude: number;
  longitude: number;
  mainText: string;
  placeId: string;
  secondaryText: string;
};

export type RouteCreateDayPayload = {
  destination: RouteCreatePlacePayload;
  label: string;
  origin: RouteCreatePlacePayload;
  stops: RouteCreatePlacePayload[];
};

export type RouteCreatePayload = {
  days: RouteCreateDayPayload[];
  motorcycle: RouteMotorcycleDraft;
  preferences: RoutePreferencesDraft;
};

export type TripIntent = "later" | "now";

export type RouteCreateTripSchedule = {
  tripDate: string;
  tripIntent: TripIntent;
  tripNote: string;
  tripTime: string;
};

export type RouteCreateCacheSnapshot = {
  draft: RouteCreateDraft;
  sheetState: SheetState;
  step: WizardStep;
  tripSchedule: RouteCreateTripSchedule;
  version: 1;
};

export type MapMarkerKind = "day-destination" | "day-start" | "day-transition" | "stop";

export type MapMarkerPoint = {
  accentColor: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  dayIndex: number;
  dayLabel: string;
  id: string;
  kind: MapMarkerKind;
  pinLabel: string;
  subtitle?: string;
  title: string;
};
