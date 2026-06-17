import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";
import type { PublicProfileEventListItem } from "@/pages/public-profile-events/types/public-profile-events.types";

export function formatDiscoverEventDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
  }).format(date);
}

export function mapDiscoverEvent(event: PublicProfileEventListItem): PublicProfileEvent {
  return {
    category: event.category,
    date: formatDiscoverEventDate(event.date),
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
