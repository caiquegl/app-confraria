import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  CreateRoutePayload,
  RouteApiResponse,
  UpdateRoutePayload,
} from "../types/saved-route.types";
import type { RoutePlaceResponse } from "../types/saved-route.types";

export async function createRoute(payload: CreateRoutePayload): Promise<RouteApiResponse> {
  const { data } = await api.post<RouteApiResponse>(apiRoutes.routes.create, payload);
  return data;
}

export async function fetchMyRoutes(): Promise<RouteApiResponse[]> {
  const { data } = await api.get<RouteApiResponse[]>(apiRoutes.routes.mine);
  return data;
}

export async function fetchRoute(routeId: string): Promise<RouteApiResponse> {
  const { data } = await api.get<RouteApiResponse>(apiRoutes.routes.detail(routeId));
  return data;
}

export async function updateRoute(
  routeId: string,
  payload: UpdateRoutePayload,
): Promise<RouteApiResponse> {
  const { data } = await api.patch<RouteApiResponse>(
    apiRoutes.routes.update(routeId),
    payload,
  );
  return data;
}

export async function updateRouteStatus(
  routeId: string,
  status: "in_progress" | "finished",
): Promise<RouteApiResponse> {
  const { data } = await api.patch<RouteApiResponse>(
    apiRoutes.routes.updateStatus(routeId),
    { status },
  );
  return data;
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

export async function removeRouteStop(
  dayId: string,
  placeId: string,
): Promise<RouteApiResponse> {
  const { data } = await api.delete<RouteApiResponse>(
    apiRoutes.routes.removeStop(dayId, placeId),
  );
  return data;
}

export type { RoutePlaceResponse };
