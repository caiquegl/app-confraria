import { router } from "expo-router";
import { useCallback } from "react";
import { InteractionManager } from "react-native";

import { LoadingView } from "@/pages/loading";
import type { AppRoute } from "@/pages/loading/types/loading.types";

export default function Index() {
  const handleComplete = useCallback((route: AppRoute) => {
    InteractionManager.runAfterInteractions(() => {
      router.replace(route === "feed" ? "/feed" : "/landing");
    });
  }, []);

  return <LoadingView onComplete={handleComplete} />;
}
