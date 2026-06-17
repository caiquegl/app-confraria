import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";
import type { PublicProfileEventListItem } from "@/pages/public-profile-events/types/public-profile-events.types";

import type { EventsDiscoverQueryFilters } from "../utils/events-filters.utils";

import { mapDiscoverEvent } from "../utils/map-discover-event";

export type EventsDiscoverScope = "this_week" | "this_month" | "category";

export type EventsDiscoverCategorySection = {
  category: string;
  events: PublicProfileEvent[];
};

export type EventsDiscoverSections = {
  categories: EventsDiscoverCategorySection[];
  thisMonth: PublicProfileEvent[];
  thisWeek: PublicProfileEvent[];
};

type DiscoverSectionsResponse = {
  categories: Array<{
    category: string;
    events: PublicProfileEventListItem[];
  }>;
  thisMonth: PublicProfileEventListItem[];
  thisWeek: PublicProfileEventListItem[];
};

function mapSections(response: DiscoverSectionsResponse): EventsDiscoverSections {
  return {
    categories: response.categories.map((section) => ({
      category: section.category,
      events: section.events.map(mapDiscoverEvent),
    })),
    thisMonth: response.thisMonth.map(mapDiscoverEvent),
    thisWeek: response.thisWeek.map(mapDiscoverEvent),
  };
}

export async function fetchEventsDiscoverSections(
  filters?: EventsDiscoverQueryFilters,
): Promise<EventsDiscoverSections> {
  const { data } = await api.get<DiscoverSectionsResponse>(
    apiRoutes.events.discoverSections(filters),
  );
  return mapSections(data);
}

export async function fetchEventsDiscoverList(params: {
  category?: string;
  filters?: EventsDiscoverQueryFilters;
  scope: EventsDiscoverScope;
}): Promise<PublicProfileEvent[]> {
  const { data } = await api.get<PublicProfileEventListItem[]>(
    apiRoutes.events.discover(params.scope, {
      category: params.category,
      filters: params.filters,
    }),
  );
  return data.map(mapDiscoverEvent);
}
