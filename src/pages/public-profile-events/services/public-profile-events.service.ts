import { Image } from "expo-image";

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  PublicProfileEvent,
  PublicProfileEventFavoriteResponse,
  PublicProfileEventListItem,
  PublicProfileEventTab,
} from "../types/public-profile-events.types";

export const PUBLIC_PROFILE_EVENT_TABS: PublicProfileEventTab[] = [
  "Inscrito",
  "Visitados",
  "Criados",
];

const TODAY_ISO = new Date().toISOString();

const MOCK_JOINED_EVENTS: PublicProfileEvent[] = [
  {
    id: "joined-1",
    title: "O Rolê com a Gata",
    category: "Moto Club Iron Horses",
    description: "Evento descontraído para casais motociclistas e amigos da estrada.",
    image:
      "https://images.unsplash.com/photo-1623868662369-0731f4a97405?q=80&w=900&auto=format&fit=crop",
    isFavorited: false,
    rating: 4.9,
    reviews: 999,
    date: "Nesta Semana",
    organizer: "Iron Horses",
    organizerAvatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=100&auto=format&fit=crop",
    location: "Rio de Janeiro",
    startsAt: TODAY_ISO,
  },
];

const MOCK_VISITED_EVENTS: PublicProfileEvent[] = [
  {
    id: "visited-1",
    title: "Encontro Nacional de Motociclistas",
    category: "Evento nacional",
    description: "Grande encontro com shows, expositores e rotas guiadas durante o fim de semana.",
    image:
      "https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=900&auto=format&fit=crop",
    isFavorited: false,
    rating: 5,
    reviews: 1200,
    date: "Outubro / 25",
    isLatestVisit: true,
    organizer: "Confraria Riders",
    organizerAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
    location: "Foz do Iguaçu",
    startsAt: "2025-10-18T12:00:00.000Z",
  },
];

export function getMockPublicProfileEvents(tab: PublicProfileEventTab): PublicProfileEvent[] {
  switch (tab) {
    case "Inscrito":
      return MOCK_JOINED_EVENTS;
    case "Visitados":
      return MOCK_VISITED_EVENTS;
    case "Criados":
    default:
      return [];
  }
}

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
  return {
    category: event.category,
    date: formatEventDateLabel(event.date),
    description: event.description ?? undefined,
    id: event.id,
    image: event.image ?? "",
    isFavorited: event.isFavorited,
    location: event.location ?? "",
    organizer: event.organizer.name,
    organizerAvatar: event.organizer.avatarUrl ?? undefined,
    rating: 0,
    reviews: 0,
    startsAt: event.date,
    title: event.title,
  };
}

function formatEventDateLabel(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
  }).format(date);
}

function prefetchEventImages(events: PublicProfileEvent[]) {
  const urls = events
    .flatMap((event) => [event.image, event.organizerAvatar])
    .filter((url): url is string => Boolean(url));

  if (urls.length === 0) return;

  void Image.prefetch(urls, "memory-disk");
}
