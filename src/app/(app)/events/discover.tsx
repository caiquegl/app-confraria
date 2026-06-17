import { router, useLocalSearchParams } from "expo-router";

import { EventsDiscoverListView } from "@/pages/events/view/EventsDiscoverListView";
import type { EventsDiscoverScope } from "@/pages/events/services/events-discover.service";
import type { EventsDiscoverQueryFilters } from "@/pages/events/utils/events-filters.utils";

function parseDiscoverFilters(rawFilters?: string): EventsDiscoverQueryFilters | undefined {
  if (!rawFilters?.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(rawFilters) as EventsDiscoverQueryFilters;
  } catch {
    return undefined;
  }
}

export default function EventsDiscoverScreen() {
  const { category, filters, scope, title } = useLocalSearchParams<{
    category?: string;
    filters?: string;
    scope?: EventsDiscoverScope;
    title?: string;
  }>();

  const resolvedScope: EventsDiscoverScope =
    scope === "this_month" || scope === "category" ? scope : "this_week";

  return (
    <EventsDiscoverListView
      category={category}
      filters={parseDiscoverFilters(filters)}
      scope={resolvedScope}
      title={title ?? "Eventos"}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/events");
      }}
      onOpenEvent={(eventId) => {
        router.push({
          pathname: "/event/[eventId]",
          params: { eventId },
        });
      }}
    />
  );
}
