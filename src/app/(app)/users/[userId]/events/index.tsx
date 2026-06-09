import { router, useLocalSearchParams } from "expo-router";

import { getCurrentUserId } from "@/lib/auth";
import { PublicProfileEventsView } from "@/pages/public-profile-events/view/PublicProfileEventsView";

export default function PublicProfileEventsScreen() {
  const { avatarUrl, userId } = useLocalSearchParams<{
    avatarUrl?: string;
    userId?: string;
  }>();

  const resolvedUserId = userId ?? "";

  const openProfile = () => {
    void getCurrentUserId().then((currentUserId) => {
      if (currentUserId === resolvedUserId) {
        router.push("/profile");
        return;
      }

      router.push({ pathname: "/users/[userId]", params: { userId: resolvedUserId } });
    });
  };

  return (
    <PublicProfileEventsView
      avatarUrl={avatarUrl}
      userId={resolvedUserId}
      onAvatarPress={openProfile}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace({ pathname: "/users/[userId]", params: { userId: resolvedUserId } });
      }}
      onCreateEvent={() =>
        router.push({
          pathname: "/users/[userId]/events/create",
          params: { userId: resolvedUserId },
        })
      }
    />
  );
}
