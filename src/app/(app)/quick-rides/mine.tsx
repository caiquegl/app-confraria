import { router } from "expo-router";

import { MyQuickRidesView } from "@/pages/my-quick-rides/view/MyQuickRidesView";

export default function MyQuickRidesScreen() {
  return (
    <MyQuickRidesView
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
