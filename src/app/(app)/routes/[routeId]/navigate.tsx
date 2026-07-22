import { router, useLocalSearchParams } from "expo-router";

import { RouteNavigationView } from "@/pages/routes/view/RouteNavigationView";

export default function RouteNavigationScreen() {
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();

  return (
    <RouteNavigationView
      routeId={routeId ?? ""}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/routes");
      }}
    />
  );
}
