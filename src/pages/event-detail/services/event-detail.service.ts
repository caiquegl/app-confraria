import { Image } from "expo-image";

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  EventDetail,
  EventParticipationResponse,
} from "../types/event-detail.types";

export async function fetchEventDetail(eventId: string): Promise<EventDetail> {
  const { data } = await api.get<EventDetail>(apiRoutes.events.detail(eventId));
  prefetchEventDetailImages(data);

  return data;
}

export async function joinEvent(eventId: string): Promise<EventParticipationResponse> {
  const { data } = await api.post<EventParticipationResponse>(
    apiRoutes.events.join(eventId),
  );

  return data;
}

function prefetchEventDetailImages(event: EventDetail) {
  const urls = [
    event.coverImageUrl,
    event.organizer.avatarUrl,
    ...event.galleryImageUrls,
  ].filter((url): url is string => Boolean(url));

  if (urls.length === 0) return;

  void Image.prefetch(urls, "memory-disk");
}
