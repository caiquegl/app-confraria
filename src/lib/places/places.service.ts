import { isAxiosError } from "axios";

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { getApiBaseUrl } from "@/lib/api-environment";
import { getToken } from "@/lib/auth";

import type {
  EstimateFuelCostRequest,
  FuelCostEstimate,
  PlaceDirectionsResponse,
  PlaceDirectionsRequestOptions,
  PlaceDirectionsWaypoint,
  PlaceGeometryDetails,
  PlaceReference,
} from "./types";
import type {
  RouteDaySuggestionsRequest,
  RouteDaySuggestionsResponse,
} from "./route-suggestions.types";

export async function fetchPlaceAutocomplete(
  input: string,
  coords?: { latitude: number; longitude: number } | null,
): Promise<PlaceReference[]> {
  const { data } = await api.get<PlaceReference[]>(
    apiRoutes.places.autocomplete(input, coords ?? undefined),
  );
  return data;
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceGeometryDetails> {
  const { data } = await api.get<PlaceGeometryDetails>(apiRoutes.places.details(placeId));
  return data;
}

const DIRECTIONS_RETRY_STATUSES = new Set([429, 502, 503]);
const DIRECTIONS_MAX_ATTEMPTS = 3;

export async function fetchPlaceDirections(
  waypoints: PlaceDirectionsWaypoint[],
  options: PlaceDirectionsRequestOptions = {},
): Promise<PlaceDirectionsResponse> {
  const payload = {
    avoidTolls: options.avoidTolls ?? false,
    includeSteps: options.includeSteps ?? false,
    waypoints,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= DIRECTIONS_MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.post<PlaceDirectionsResponse>(
        apiRoutes.places.directions,
        payload,
      );
      return data;
    } catch (error) {
      lastError = error;
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const canRetry =
        status != null &&
        DIRECTIONS_RETRY_STATUSES.has(status) &&
        attempt < DIRECTIONS_MAX_ATTEMPTS;

      if (!canRetry) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }

  throw lastError;
}

export async function fetchFuelCostEstimate(
  request: EstimateFuelCostRequest,
): Promise<FuelCostEstimate> {
  const { data } = await api.post<FuelCostEstimate>(apiRoutes.places.estimateFuel, request);
  return data;
}

export async function fetchRouteDaySuggestions(
  days: RouteDaySuggestionsRequest[],
): Promise<RouteDaySuggestionsResponse[]> {
  const { data } = await api.post<RouteDaySuggestionsResponse[]>(
    apiRoutes.places.routeSuggestions,
    { days },
  );
  return data;
}

export async function buildPlacePhotoSource(photoName: string | null): Promise<{
  headers?: { Authorization: string };
  uri: string;
} | null> {
  if (!photoName) {
    return null;
  }

  const [baseUrl, token] = await Promise.all([getApiBaseUrl(), getToken()]);
  if (!baseUrl) {
    return null;
  }

  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    uri: `${baseUrl}${apiRoutes.places.photoMedia(photoName)}`,
  };
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
