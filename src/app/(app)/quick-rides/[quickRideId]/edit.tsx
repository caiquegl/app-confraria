import { router, useLocalSearchParams } from "expo-router";

import { QuickRideEditView } from "@/pages/quick-ride-edit/view/QuickRideEditView";

export default function QuickRideEditScreen() {
  const { quickRideId } = useLocalSearchParams<{ quickRideId?: string }>();

  return (
    <QuickRideEditView
      quickRideId={quickRideId ?? ""}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/events");
      }}
      onSaved={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace({
          pathname: "/quick-rides/[quickRideId]",
          params: { quickRideId: quickRideId ?? "" },
        });
      }}
    />
  );
}
