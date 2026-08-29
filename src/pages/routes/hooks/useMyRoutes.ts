import { useCallback, useState } from "react";

import { useFocusEffect } from "expo-router";

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
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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
    } catch {
      setError("Não foi possível carregar suas rotas.");
      setRoutes([]);
      setQuota(DEFAULT_QUOTA);
    } finally {
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
