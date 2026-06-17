import { router, useLocalSearchParams } from "expo-router";

import { EventsDiscoverListView } from "@/pages/events/view/EventsDiscoverListView";
import type { EventsDiscoverScope } from "@/pages/events/services/events-discover.service";

export default function EventsDiscoverScreen() {
  const { category, scope, title } = useLocalSearchParams<{
    category?: string;
    scope?: EventsDiscoverScope;
    title?: string;
  }>();

  const resolvedScope: EventsDiscoverScope =
    scope === "this_month" || scope === "category" ? scope : "this_week";

  return (
    <EventsDiscoverListView
      category={category}
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
