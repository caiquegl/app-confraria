import { router } from "expo-router";
import { useCallback } from "react";

import { runWhenIdle } from "@/lib/run-when-idle";
import { LoadingView } from "@/pages/loading";
import type { AppRoute } from "@/pages/loading/types/loading.types";

export default function Index() {
  const handleComplete = useCallback((route: AppRoute) => {
    runWhenIdle(() => {
      router.replace(route === "feed" ? "/feed" : "/landing");
    });
  }, []);

  return <LoadingView onComplete={handleComplete} />;
}
