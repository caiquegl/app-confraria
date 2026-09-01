import { useCallback, useEffect, useMemo, useState } from "react";

import { subscribeRoutePhotoCreated } from "@/lib/route-navigation-socket";

import { fetchRoutePhotos } from "../services/routes.service";
import type { RoutePhoto, RoutePhotoCluster } from "../types/route-photo.types";
import { clusterRoutePhotos } from "../utils/cluster-route-photos";

type UseRouteMapPhotosParams = {
  enabled: boolean;
  routeId: string;
};

export function useRouteMapPhotos({ enabled, routeId }: UseRouteMapPhotosParams) {
  const [photos, setPhotos] = useState<RoutePhoto[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<RoutePhotoCluster | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !routeId) return;

    setIsLoading(true);
    try {
      const next = await fetchRoutePhotos(routeId);
      setPhotos(next);
    } catch {
      // Mantém o que já está em memória se a listagem falhar.
    } finally {
      setIsLoading(false);
    }
  }, [enabled, routeId]);

  useEffect(() => {
    if (!enabled) {
      setPhotos([]);
      setSelectedCluster(null);
      return;
    }

    void reload();
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeRoutePhotoCreated((photo) => {
      if (photo.routeId !== routeId) return;

      setPhotos((current) => {
        if (current.some((item) => item.id === photo.id)) {
          return current;
        }
        return [...current, photo];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, routeId]);

  const clusters = useMemo(() => clusterRoutePhotos(photos), [photos]);

  const openCluster = useCallback((cluster: RoutePhotoCluster) => {
    setSelectedCluster(cluster);
  }, []);

  const closeCluster = useCallback(() => {
    setSelectedCluster(null);
  }, []);

  const upsertPhoto = useCallback((photo: RoutePhoto) => {
    setPhotos((current) => {
      if (current.some((item) => item.id === photo.id)) {
        return current;
      }
      return [...current, photo];
    });
  }, []);

  return {
    closeCluster,
    clusters,
    isLoading,
    openCluster,
    photos,
    reload,
    selectedCluster,
    upsertPhoto,
  };
}
