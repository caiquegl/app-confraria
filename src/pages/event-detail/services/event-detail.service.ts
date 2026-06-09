import { Image } from "expo-image";

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type { EventDetail } from "../types/event-detail.types";

export async function fetchEventDetail(eventId: string): Promise<EventDetail> {
  const { data } = await api.get<EventDetail>(apiRoutes.events.detail(eventId));
  prefetchEventDetailImages(data);

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
