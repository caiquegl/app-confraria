import { router, useLocalSearchParams } from "expo-router";

import { EventDetailView } from "@/pages/event-detail/view/EventDetailView";

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  return (
    <EventDetailView
      eventId={eventId ?? ""}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/events");
      }}
    />
  );
}
