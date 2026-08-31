import { useCallback, useRef, useState } from "react";

import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";

import { nextListLoadError, type ListLoadError } from "@/lib/list-load-state";
import { fetchMyRoutes } from "../services/routes.service";
import type { MyRoutesQuota, SavedRoute } from "../types/saved-route.types";
import { mapApiRouteToSavedRoute } from "../utils/saved-route.mapper";

const DEFAULT_QUOTA: MyRoutesQuota = {
  historyDays: null,
  historyLimited: false,
  isPremium: true,
  savedPrivateCount: 0,
  savedPrivateLimit: null,
};

export function useMyRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [quota, setQuota] = useState<MyRoutesQuota>(DEFAULT_QUOTA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ListLoadError>(null);
  const hasLoadedOnceRef = useRef(false);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const isRefresh = hasLoadedOnceRef.current;
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      const page = await fetchMyRoutes();
      setRoutes(page.data.map(mapApiRouteToSavedRoute));
      setQuota({
        historyDays: page.historyDays,
        historyLimited: page.historyLimited,
        isPremium: page.isPremium,
        savedPrivateCount: page.savedPrivateCount,
        savedPrivateLimit: page.savedPrivateLimit,
      });
      setError(null);
      hasLoadedOnceRef.current = true;
    } catch {
      const nextError = nextListLoadError(hasLoadedOnceRef.current);
      setError(nextError);
      if (nextError === "refresh") {
        Toast.show({
          type: "error",
          text1: "Não foi possível atualizar suas rotas",
          text2: "Mantivemos a lista anterior.",
        });
      }
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    error,
    isLoading,
    quota,
    refresh,
    routes,
  };
}
