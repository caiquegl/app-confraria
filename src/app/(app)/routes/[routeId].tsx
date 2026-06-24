import { router, useLocalSearchParams } from "expo-router";

import { RouteDetailView } from "@/pages/routes/view/RouteDetailView";

export default function RouteDetailScreen() {
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();

  return (
    <RouteDetailView
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
