import { router } from "expo-router";

import { setHighlightPostId } from "@/lib/feed-highlight-store";
import { NotificationsView } from "@/pages/notifications";

export default function NotificationsScreen() {
  return (
    <NotificationsView
      onBack={() => router.back()}
      onOpenPost={(postId) => {
        setHighlightPostId(postId);
        router.back();
      }}
    />
  );
}
