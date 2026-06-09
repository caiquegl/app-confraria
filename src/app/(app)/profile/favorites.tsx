import { router } from "expo-router";

import { FavoritesView } from "@/pages/favorites/view/FavoritesView";

export default function FavoritesScreen() {
  return (
    <FavoritesView
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
