import { router, useLocalSearchParams } from "expo-router";

import { EventAnalyticsView } from "@/pages/event-analytics/view/EventAnalyticsView";

export default function EventAnalyticsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  return (
    <EventAnalyticsView
      eventId={eventId ?? ""}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/profile");
      }}
    />
  );
}
