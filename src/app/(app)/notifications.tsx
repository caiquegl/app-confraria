import { router } from "expo-router";

import { setHighlightPostId } from "@/lib/feed-highlight-store";
import { NotificationsView } from "@/pages/notifications";

export default function NotificationsScreen() {
  return (
    <NotificationsView
      onBack={() => router.back()}
      onOpenEvent={(eventId) => {
        router.push({
          pathname: "/event/[eventId]",
          params: { eventId },
        });
      }}
      onOpenPost={(postId) => {
        setHighlightPostId(postId);
        router.back();
      }}
      onOpenQuickRide={(quickRideId) => {
        router.push({
          pathname: "/quick-rides/[quickRideId]",
          params: { quickRideId },
        });
      }}
    />
  );
}
