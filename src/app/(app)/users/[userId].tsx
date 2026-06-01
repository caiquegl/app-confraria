import { router, useLocalSearchParams } from "expo-router";

import { PublicProfileView } from "@/pages/public-profile/view/PublicProfileView";

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  return (
    <PublicProfileView
      userId={userId ?? ""}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/feed");
      }}
    />
  );
}
