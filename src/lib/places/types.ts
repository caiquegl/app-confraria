export type PlaceReference = {
  description: string;
  mainText: string;
  placeId: string;
  reference: string;
  secondaryText: string;
  types: string[];
};

export type PlaceGeometryDetails = {
  city?: string | null;
  latitude: number;
  longitude: number;
  placeId: string;
  region?: string | null;
};

export type PlaceWithCoords = PlaceReference & {
  latitude?: number;
  longitude?: number;
};

export type PlaceDirectionsWaypoint = {
  latitude: number;
  longitude: number;
};

export type PlaceDirectionsRouteOption = {
  distanceMeters: number | null;
  durationSeconds: number | null;
  encodedPolyline: string;
  id: string;
  isDefault: boolean;
  tollAvailable: boolean;
  tollCost: number | null;
  tollCount: number | null;
};

export type PlaceDirectionsRequestOptions = {
  avoidTolls?: boolean;
};

export type PlaceDirectionsResponse = {
  routes: PlaceDirectionsRouteOption[];
};

export type FuelCostEstimate = {
  fuelCost: number;
  fuelType: string;
  liters: number;
  pricePerLiter: number;
  source: "anp" | "national_average";
  stateCode: string;
};

export type EstimateFuelCostRequest = {
  baseConsumption: number;
  destinationPlaceId?: string;
  distanceMeters: number;
  fuelType?: "gasoline" | "ethanol" | "diesel_s10";
  stateCode?: string;
};
