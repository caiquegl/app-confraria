import {
  fetchFavoritePublicProfileEvents,
  togglePublicProfileEventFavorite,
} from "@/pages/public-profile-events/services/public-profile-events.service";

import type { FavoriteEvent } from "../types/favorites.types";

export async function fetchFavoriteEvents(): Promise<FavoriteEvent[]> {
  return fetchFavoritePublicProfileEvents();
}

export async function toggleFavoriteEvent(eventId: string) {
  return togglePublicProfileEventFavorite(eventId);
}
