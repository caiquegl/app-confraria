import { router, useLocalSearchParams } from "expo-router";

import { QuickRideDetailView } from "@/pages/quick-ride-detail/view/QuickRideDetailView";

export default function QuickRideDetailScreen() {
  const { quickRideId } = useLocalSearchParams<{ quickRideId?: string }>();

  return (
    <QuickRideDetailView
      quickRideId={quickRideId ?? ""}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/events");
      }}
    />
  );
}
