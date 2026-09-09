import { Image } from "expo-image";

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { formatEventPeriodLabel, resolvePeriodFromLegacy } from "@/lib/event-period";

import type {
  PublicProfileEvent,
  PublicProfileEventFavoriteResponse,
  PublicProfileEventListItem,
  PublicProfileEventTab,
} from "../types/public-profile-events.types";

export const PUBLIC_PROFILE_EVENT_TABS: PublicProfileEventTab[] = [
  "Inscrito",
  "Criados",
];

export async function fetchCreatedPublicProfileEvents(
  userId: string,
  query?: string,
): Promise<PublicProfileEvent[]> {
  const { data } = await api.get<PublicProfileEventListItem[]>(
    apiRoutes.events.userCreated(userId, query),
  );
  const events = data.map(mapCreatedEvent);

  prefetchEventImages(events);

  return events;
}

export async function fetchJoinedPublicProfileEvents(
  userId: string,
  query?: string,
): Promise<PublicProfileEvent[]> {
  const { data } = await api.get<PublicProfileEventListItem[]>(
    apiRoutes.events.userJoined(userId, query),
  );
  const events = data.map(mapEventListItem);

  prefetchEventImages(events);

  return events;
}

export async function fetchJoinedPublicProfileEventsCount(userId: string): Promise<number> {
  const { data } = await api.get<PublicProfileEventListItem[]>(
    apiRoutes.events.userJoined(userId),
  );

  return data.length;
}

export async function fetchFavoritePublicProfileEvents(): Promise<PublicProfileEvent[]> {
  const { data } = await api.get<PublicProfileEventListItem[]>(apiRoutes.events.favorites);
  const events = data.map(mapEventListItem);

  prefetchEventImages(events);

  return events;
}

export async function togglePublicProfileEventFavorite(
  eventId: string,
): Promise<PublicProfileEventFavoriteResponse> {
  const { data } = await api.post<PublicProfileEventFavoriteResponse>(
    apiRoutes.events.favorite(eventId),
  );

  return data;
}

function mapCreatedEvent(event: PublicProfileEventListItem): PublicProfileEvent {
  return mapEventListItem(event);
}

function mapEventListItem(event: PublicProfileEventListItem): PublicProfileEvent {
  const period = resolvePeriodFromLegacy({
    date: event.date,
    endsAt: event.endsAt,
    startsAt: event.startsAt,
  });

  return {
    category: event.category,
    date: formatEventPeriodLabel({
      endsAt: period.endsAt,
      startsAt: period.startsAt,
    }),
    description: event.description ?? undefined,
    endsAt: period.endsAt,
    id: event.id,
    image: event.image ?? "",
    isFavorited: event.isFavorited,
    location: event.location ?? "",
    organizer: event.organizer.name,
    organizerAvatar: event.organizer.avatarUrl ?? undefined,
    rating: 0,
    reviews: 0,
    startsAt: period.startsAt,
    title: event.title,
  };
}

function prefetchEventImages(events: PublicProfileEvent[]) {
  const urls = events
    .flatMap((event) => [event.image, event.organizerAvatar])
    .filter((url): url is string => Boolean(url));

  if (urls.length === 0) return;

  void Image.prefetch(urls, "memory-disk");
}
