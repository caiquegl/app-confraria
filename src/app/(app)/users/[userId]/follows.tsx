import { router, useLocalSearchParams } from "expo-router";

import { getCurrentUserId } from "@/lib/auth";
import { PublicProfileFollowsView } from "@/pages/public-profile/view/PublicProfileFollowsView";
import type { PublicProfileFollowTab } from "@/pages/public-profile/types/public-profile.types";

export default function PublicProfileFollowsScreen() {
  const { initialTab, userId } = useLocalSearchParams<{
    initialTab?: PublicProfileFollowTab;
    userId?: string;
  }>();

  const openProfile = (targetUserId: string) => {
    void getCurrentUserId().then((currentUserId) => {
      if (currentUserId === targetUserId) {
        router.push("/profile");
        return;
      }

      router.push({ pathname: "/users/[userId]", params: { userId: targetUserId } });
    });
  };

  return (
    <PublicProfileFollowsView
      initialTab={initialTab === "following" ? "following" : "followers"}
      userId={userId ?? ""}
      onBack={() => router.back()}
      onOpenProfile={openProfile}
    />
  );
}
