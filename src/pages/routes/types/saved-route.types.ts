export type RouteStatus = "scheduled" | "in_progress" | "finished";

export type RouteCreateAction = "start_now" | "save_for_later";

export type RelativePeriod = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "UPCOMING" | "NO_DATE";

export type RouteStatusFilter = "SCHEDULED" | "NO_DATE" | "OFFLINE";

export type RouteCompletionFilter = "ALL" | "TRAVELED" | "PLANNED";

export type SavedRouteFilters = {
  bike: string;
  completion: RouteCompletionFilter;
  endDate: string;
  period: RelativePeriod;
  startDate: string;
  statuses: RouteStatusFilter[];
};

export type SavedRouteDay = {
  dayNumber: number;
  id: string;
  label: string;
};

export type SavedRoute = {
  avoidTolls: boolean;
  bikeId: string;
  bikeName: string;
  createdAt: string;
  dayCount: number;
  days: SavedRouteDay[];
  destinationLabel: string;
  distanceLabel: string;
  durationLabel: string;
  fuelCost: number | null;
  id: string;
  optimizeFuel: boolean;
  originLabel: string;
  startsAt: string;
  status: RouteStatus;
  title: string;
  tollCost: number | null;
  tripDate: string;
  tripNote: string | null;
  tripTime: string;
  updatedAt: string;
};

export type SavedRouteGroup = {
  label: string;
  routes: SavedRoute[];
};

export type CreateRoutePayload = {
  action: RouteCreateAction;
  days: Array<{
    destination: {
      description: string;
      latitude: number;
      longitude: number;
      mainText: string;
      placeId: string;
      secondaryText: string;
    };
    distanceMeters?: number;
    durationSeconds?: number;
    label: string;
    origin: {
      description: string;
      latitude: number;
      longitude: number;
      mainText: string;
      placeId: string;
      secondaryText: string;
    };
    stops: Array<{
      description: string;
      latitude: number;
      longitude: number;
      mainText: string;
      placeId: string;
      secondaryText: string;
    }>;
  }>;
  motorcycle: {
    bikeId: string;
  };
  preferences: {
    avoidTolls: boolean;
    optimizeFuel: boolean;
  };
  schedule?: {
    tripDate?: string;
    tripNote?: string;
    tripTime?: string;
  };
  totals?: {
    distanceMeters?: number;
    durationSeconds?: number;
    fuelCost?: number;
    tollCost?: number;
  };
};

export type RoutePlaceResponse = {
  description: string;
  id: string;
  latitude: number;
  longitude: number;
  mainText: string;
  order: number;
  placeId: string;
  region: string | null;
  role: "origin" | "destination" | "stop";
  secondaryText: string | null;
};

export type RouteDayApiResponse = {
  dayNumber: number;
  distanceMeters: number | null;
  durationSeconds: number | null;
  id: string;
  label: string;
  places: RoutePlaceResponse[];
};

export type RouteApiResponse = {
  avoidTolls: boolean;
  bike: {
    id: string;
    imageUrl: string | null;
    name: string;
  };
  createdAt: string;
  days: RouteDayApiResponse[];
  destinationLabel: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
  fuelCost: number | null;
  id: string;
  optimizeFuel: boolean;
  originLabel: string;
  startsAt: string;
  status: RouteStatus;
  title: string;
  tollCost: number | null;
  tripNote: string | null;
  updatedAt: string;
  userBikeId: string;
};

export type UpdateRoutePayload = Omit<CreateRoutePayload, "action">;
