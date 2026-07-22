import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  ImportPlaceResponse,
  NearbyCategory,
  NearbyPlace,
  PlaceLiveInfo,
} from "../types/services.types";

export async function fetchNearbyPlaces(params: {
  category: NearbyCategory;
  latitude: number;
  longitude: number;
  radius?: number;
  signal?: AbortSignal;
}): Promise<NearbyPlace[]> {
  const { data } = await api.post<NearbyPlace[]>(
    apiRoutes.places.nearby,
    {
      category: params.category,
      latitude: params.latitude,
      longitude: params.longitude,
      ...(params.radius ? { radius: params.radius } : {}),
    },
    { signal: params.signal },
  );
  return data;
}

export async function importPlace(params: {
  googlePlaceId: string;
  category?: string;
}): Promise<ImportPlaceResponse> {
  const { data } = await api.post<ImportPlaceResponse>(apiRoutes.places.import, {
    googlePlaceId: params.googlePlaceId,
    ...(params.category ? { category: params.category } : {}),
  });
  return data;
}

export async function fetchPlaceLiveInfo(
  googlePlaceId: string,
): Promise<PlaceLiveInfo> {
  const { data } = await api.get<PlaceLiveInfo>(
    apiRoutes.places.live(googlePlaceId),
  );
  return data;
}
