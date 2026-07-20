import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import {
  fetchFriendsRoutes,
  PUBLISHED_ROUTES_PAGE_SIZE,
} from "../services/routes.service";
import type { SavedRoute } from "../types/saved-route.types";
import { mapApiRouteToSavedRoute } from "../utils/saved-route.mapper";

type UseFriendsRoutesOptions = {
  enabled: boolean;
  searchQuery: string;
};

export function useFriendsRoutes({ enabled, searchQuery }: UseFriendsRoutesOptions) {
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadInitial = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    try {
      const page = await fetchFriendsRoutes({
        limit: PUBLISHED_ROUTES_PAGE_SIZE,
        q: debouncedSearch,
      });
      if (!mountedRef.current) return;

      setRoutes(page.data.map(mapApiRouteToSavedRoute));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      if (!mountedRef.current) return;
      setRoutes([]);
      setNextCursor(null);
      setHasMore(false);
      Toast.show({
        type: "error",
        text1: "Erro ao carregar rotas de amigos",
        text2: "Não foi possível buscar os roteiros de quem você segue.",
      });
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, enabled]);

  useEffect(() => {
    if (!enabled) return;
    void loadInitial();
  }, [enabled, loadInitial]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      void loadInitial();
    }, [enabled, loadInitial]),
  );

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMoreRef.current || !hasMoreRef.current || !nextCursorRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await fetchFriendsRoutes({
        cursor: nextCursorRef.current,
        limit: PUBLISHED_ROUTES_PAGE_SIZE,
        q: debouncedSearch,
      });
      if (!mountedRef.current) return;

      setRoutes((current) => {
        const existingIds = new Set(current.map((route) => route.id));
        const nextRoutes = page.data
          .map(mapApiRouteToSavedRoute)
          .filter((route) => !existingIds.has(route.id));
        return [...current, ...nextRoutes];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      if (!mountedRef.current) return;
      Toast.show({
        type: "error",
        text1: "Erro ao carregar mais rotas",
        text2: "Tente novamente em instantes.",
      });
    } finally {
      loadingMoreRef.current = false;
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [debouncedSearch, enabled]);

  return {
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    refresh: loadInitial,
    routes,
  };
}
