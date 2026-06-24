import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  EstimateFuelCostRequest,
  FuelCostEstimate,
  PlaceDirectionsResponse,
  PlaceDirectionsRequestOptions,
  PlaceDirectionsWaypoint,
  PlaceGeometryDetails,
  PlaceReference,
} from "./types";

export async function fetchPlaceAutocomplete(input: string): Promise<PlaceReference[]> {
  const { data } = await api.get<PlaceReference[]>(apiRoutes.places.autocomplete(input));
  return data;
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceGeometryDetails> {
  const { data } = await api.get<PlaceGeometryDetails>(apiRoutes.places.details(placeId));
  return data;
}

export async function fetchPlaceDirections(
  waypoints: PlaceDirectionsWaypoint[],
  options: PlaceDirectionsRequestOptions = {},
): Promise<PlaceDirectionsResponse> {
  const { data } = await api.post<PlaceDirectionsResponse>(apiRoutes.places.directions, {
    avoidTolls: options.avoidTolls ?? false,
    waypoints,
  });
  return data;
}

export async function fetchFuelCostEstimate(
  request: EstimateFuelCostRequest,
): Promise<FuelCostEstimate> {
  const { data } = await api.post<FuelCostEstimate>(apiRoutes.places.estimateFuel, request);
  return data;
}

export async function resolvePlaceWithCoords(place: PlaceReference): Promise<PlaceReference & {
  latitude: number;
  longitude: number;
}> {
  const details = await fetchPlaceDetails(place.placeId);
  return {
    ...place,
    latitude: details.latitude,
    longitude: details.longitude,
  };
}
