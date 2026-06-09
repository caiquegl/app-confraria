import { router, useLocalSearchParams } from "expo-router";

import { EventCreateView } from "@/pages/event-create/view/EventCreateView";

export default function EventCreateScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const resolvedUserId = userId ?? "";

  const goToEvents = () => {
    router.replace({ pathname: "/users/[userId]/events", params: { userId: resolvedUserId } });
  };

  return (
    <EventCreateView
      userId={resolvedUserId}
      onClose={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        goToEvents();
      }}
      onPublished={goToEvents}
    />
  );
}
