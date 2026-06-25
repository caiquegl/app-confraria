import { useCallback, useState } from "react";

import { useFocusEffect } from "expo-router";

import { fetchMyRoutes } from "../services/routes.service";
import type { SavedRoute } from "../types/saved-route.types";
import { mapApiRouteToSavedRoute } from "../utils/saved-route.mapper";

export function useMyRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMyRoutes();
      setRoutes(data.map(mapApiRouteToSavedRoute));
    } catch {
      setError("Não foi possível carregar suas rotas.");
      setRoutes([]);
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
    refresh,
    routes,
  };
}
