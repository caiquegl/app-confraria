import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-environment";
import { apiRoutes } from "@/lib/api-routes";
import { getToken } from "@/lib/auth";
import { optimizeImageForUpload } from "@/lib/media-optimization";

import type { RoutePhoto } from "../types/route-photo.types";
import type {
  CreateRoutePayload,
  MyRoutesListResponse,
  PublishedRoutesPageResponse,
  RouteApiResponse,
  UpdateRoutePayload,
  UpsertRouteReviewPayload,
  UpsertRouteReviewResponse,
} from "../types/saved-route.types";
import type { RoutePlaceResponse } from "../types/saved-route.types";
import {
  copyPublishedRoute as copyPublishedRouteRequest,
  createRoute as createRouteRequest,
  updateRoute as updateRouteRequest,
} from "../utils/route-cover-request.utils";

export async function createRoute(
  payload: CreateRoutePayload,
  coverImageUri?: string | null,
): Promise<RouteApiResponse> {
  return createRouteRequest(payload, coverImageUri);
}

export async function fetchMyRoutes(): Promise<MyRoutesListResponse> {
  const { data } = await api.get<MyRoutesListResponse | RouteApiResponse[]>(
    apiRoutes.routes.mine,
  );

  // Compatibilidade transitória se o backend ainda devolver array.
  if (Array.isArray(data)) {
    return {
      data,
      historyDays: null,
      historyLimited: false,
      isPremium: true,
      savedPrivateCount: 0,
      savedPrivateLimit: null,
    };
  }

  return data;
}

export async function fetchMyRecentRoutes(days = 30): Promise<RouteApiResponse[]> {
  const { data } = await api.get<RouteApiResponse[]>(apiRoutes.routes.recents(days));
  return data;
}

export async function copyPublishedRoute(
  routeId: string,
  payload: CreateRoutePayload,
  coverImageUri?: string | null,
): Promise<RouteApiResponse> {
  return copyPublishedRouteRequest(routeId, payload, coverImageUri);
}

export const PUBLISHED_ROUTES_PAGE_SIZE = 10;

export async function fetchMyPublishedRoutes(options?: {
  cursor?: string;
  limit?: number;
  q?: string;
}): Promise<PublishedRoutesPageResponse> {
  const { data } = await api.get<PublishedRoutesPageResponse>(
    apiRoutes.routes.minePublished(options),
  );
  return data;
}

export async function fetchNearPublishedRoutes(options: {
  city: string;
  cursor?: string;
  limit?: number;
  q?: string;
  region?: string;
}): Promise<PublishedRoutesPageResponse> {
  const { data } = await api.get<PublishedRoutesPageResponse>(
    apiRoutes.routes.nearYou(options),
  );
  return data;
}

export async function fetchFriendsRoutes(options?: {
  cursor?: string;
  limit?: number;
  q?: string;
}): Promise<PublishedRoutesPageResponse> {
  const { data } = await api.get<PublishedRoutesPageResponse>(
    apiRoutes.routes.friends(options),
  );
  return data;
}

export async function fetchRoute(routeId: string): Promise<RouteApiResponse> {
  const { data } = await api.get<RouteApiResponse>(apiRoutes.routes.detail(routeId));
  return data;
}

export async function fetchPendingRouteReview(): Promise<RouteApiResponse | null> {
  const { data } = await api.get<{ route: RouteApiResponse | null }>(
    apiRoutes.routes.pendingReview,
  );
  return data.route ?? null;
}

export async function upsertRouteReview(
  routeId: string,
  payload: UpsertRouteReviewPayload,
): Promise<UpsertRouteReviewResponse> {
  const { data } = await api.put<UpsertRouteReviewResponse>(
    apiRoutes.routes.reviews(routeId),
    {
      comment: payload.comment?.trim() || undefined,
      rating: payload.rating,
    },
  );
  return data;
}

export async function updateRoute(
  routeId: string,
  payload: UpdateRoutePayload,
  coverImageUri?: string | null,
): Promise<RouteApiResponse> {
  return updateRouteRequest(routeId, payload, coverImageUri);
}

export async function updateRouteStatus(
  routeId: string,
  status: "in_progress" | "finished",
): Promise<RouteApiResponse> {
  try {
    const { data } = await api.patch<RouteApiResponse>(
      apiRoutes.routes.updateStatus(routeId),
      { status },
    );
    return data;
  } catch (error) {
    const httpStatus = (error as { response?: { status?: number } })?.response?.status;
    if (httpStatus !== 400) {
      throw error;
    }

    const current = await fetchRoute(routeId);
    if (current.status === status) {
      return current;
    }

    throw error;
  }
}

export async function deleteRoute(routeId: string): Promise<void> {
  await api.delete(apiRoutes.routes.delete(routeId));
}

type AddRouteStopPayload = {
  description: string;
  latitude: number;
  longitude: number;
  mainText: string;
  placeId: string;
  secondaryText?: string;
};

export async function addRouteStop(
  dayId: string,
  place: AddRouteStopPayload,
): Promise<RouteApiResponse> {
  const { data } = await api.post<RouteApiResponse>(apiRoutes.routes.addStop(dayId), {
    place,
  });
  return data;
}

export async function respondToRouteInvitation(
  routeId: string,
  accept: boolean,
): Promise<RouteApiResponse> {
  const { data } = await api.patch<RouteApiResponse>(
    apiRoutes.routes.respondInvitation(routeId),
    { accept },
  );
  return data;
}

export async function updateRouteLocation(
  routeId: string,
  payload: { heading?: number; latitude: number; longitude: number },
): Promise<void> {
  await api.patch(apiRoutes.routes.updateLocation(routeId), payload);
}

export async function updateRoutePublish(
  routeId: string,
  isPublished: boolean,
): Promise<RouteApiResponse> {
  const { data } = await api.patch<RouteApiResponse>(
    apiRoutes.routes.updatePublish(routeId),
    { isPublished },
  );
  return data;
}

export async function removeRouteStop(
  dayId: string,
  placeId: string,
): Promise<RouteApiResponse> {
  const { data } = await api.delete<RouteApiResponse>(
    apiRoutes.routes.removeStop(dayId, placeId),
  );
  return data;
}

export async function fetchRoutePhotos(routeId: string): Promise<RoutePhoto[]> {
  const { data } = await api.get<RoutePhoto[]>(apiRoutes.routes.photos(routeId));
  return data;
}

export async function fetchNearbyMapPhotos(options: {
  latitude: number;
  longitude: number;
  limit?: number;
  radiusKm?: number;
}): Promise<RoutePhoto[]> {
  const { data } = await api.get<RoutePhoto[]>(apiRoutes.routes.mapPhotos(options));
  return data;
}

export async function createRoutePhoto(params: {
  imageUri: string;
  latitude: number;
  longitude: number;
  routeId: string;
}): Promise<RoutePhoto> {
  const optimized = await optimizeImageForUpload(params.imageUri);
  const formData = new FormData();
  formData.append("latitude", String(params.latitude));
  formData.append("longitude", String(params.longitude));
  formData.append("file", {
    name: `route-photo-${Date.now()}.${optimized.extension}`,
    type: optimized.mimeType,
    uri: optimized.uri,
  } as unknown as Blob);

  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseURL}${apiRoutes.routes.photos(params.routeId)}`);
    xhr.timeout = 120000;
    xhr.setRequestHeader("Accept", "application/json");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
        return;
      }

      let message = "Não foi possível marcar a foto no mapa.";
      try {
        const parsed = JSON.parse(xhr.responseText) as { message?: string | string[] };
        if (typeof parsed.message === "string") message = parsed.message;
        else if (Array.isArray(parsed.message)) message = parsed.message.join(", ");
      } catch {
        // ignore parse errors
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Falha de rede ao enviar a foto."));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado ao enviar a foto."));
    xhr.send(formData);
  });

  return JSON.parse(responseText) as RoutePhoto;
}

export type { RoutePlaceResponse };
