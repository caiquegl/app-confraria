import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  Service,
  ServiceReview,
  UpsertReviewPayload,
} from "../types/services.types";

export async function fetchServices(category?: string): Promise<Service[]> {
  const { data } = await api.get<Service[]>(apiRoutes.services.list(category));
  return data;
}

export async function fetchServiceDetail(serviceId: string): Promise<Service> {
  const { data } = await api.get<Service>(apiRoutes.services.detail(serviceId));
  return data;
}

export async function favoriteService(
  serviceId: string,
): Promise<{ id: string; isFavorited: boolean }> {
  const { data } = await api.post<{ id: string; isFavorited: boolean }>(
    apiRoutes.services.favorite(serviceId),
  );
  return data;
}

export async function unfavoriteService(
  serviceId: string,
): Promise<{ id: string; isFavorited: boolean }> {
  const { data } = await api.delete<{ id: string; isFavorited: boolean }>(
    apiRoutes.services.favorite(serviceId),
  );
  return data;
}

export async function toggleServiceFavorite(
  serviceId: string,
  isCurrentlyFavorited: boolean,
): Promise<{ id: string; isFavorited: boolean }> {
  return isCurrentlyFavorited
    ? unfavoriteService(serviceId)
    : favoriteService(serviceId);
}

export async function fetchServiceReviews(
  serviceId: string,
): Promise<ServiceReview[]> {
  const { data } = await api.get<ServiceReview[]>(
    apiRoutes.services.reviews(serviceId),
  );
  return data;
}

export async function upsertServiceReview(
  serviceId: string,
  payload: UpsertReviewPayload,
): Promise<{ service: Service; review: ServiceReview }> {
  const { data } = await api.put<{ service: Service; review: ServiceReview }>(
    apiRoutes.services.reviews(serviceId),
    payload,
  );
  return data;
}

export async function deleteServiceReview(
  serviceId: string,
): Promise<{ service: Service }> {
  const { data } = await api.delete<{ service: Service }>(
    apiRoutes.services.reviews(serviceId),
  );
  return data;
}
