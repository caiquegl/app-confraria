import { router, useLocalSearchParams } from "expo-router";

import { EventEditView } from "@/pages/event-edit/view/EventEditView";

export default function EventEditScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  return (
    <EventEditView
      eventId={eventId ?? ""}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace({
          pathname: "/event/[eventId]/analytics",
          params: { eventId: eventId ?? "" },
        });
      }}
      onSaved={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace({
          pathname: "/event/[eventId]/analytics",
          params: { eventId: eventId ?? "" },
        });
      }}
    />
  );
}
