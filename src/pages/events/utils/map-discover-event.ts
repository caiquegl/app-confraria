import type {
  PublicProfileEventListItem,
  PublicProfileEvent,
} from "@/pages/public-profile-events/types/public-profile-events.types";
import { formatEventPeriodLabel, resolvePeriodFromLegacy } from "@/lib/event-period";

export function mapDiscoverEvent(event: PublicProfileEventListItem): PublicProfileEvent {
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
