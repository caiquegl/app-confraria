import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchNearbyMapPhotos } from "../services/routes.service";
import type { RoutePhoto, RoutePhotoCluster } from "../types/route-photo.types";
import { clusterRoutePhotos } from "../utils/cluster-route-photos";

type UseNearbyRouteMapPhotosParams = {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  radiusKm?: number;
};

export function useNearbyRouteMapPhotos({
  enabled,
  latitude,
  longitude,
  radiusKm = 40,
}: UseNearbyRouteMapPhotosParams) {
  const [photos, setPhotos] = useState<RoutePhoto[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<RoutePhotoCluster | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || latitude == null || longitude == null) return;

    setIsLoading(true);
    try {
      const next = await fetchNearbyMapPhotos({
        latitude,
        longitude,
        radiusKm,
      });
      setPhotos(next);
    } catch {
      // Mantém o que já está em memória se a listagem falhar.
    } finally {
      setIsLoading(false);
    }
  }, [enabled, latitude, longitude, radiusKm]);

  useEffect(() => {
    if (!enabled || latitude == null || longitude == null) {
      setPhotos([]);
      setSelectedCluster(null);
      return;
    }

    void reload();
  }, [enabled, latitude, longitude, reload]);

  const clusters = useMemo(() => clusterRoutePhotos(photos), [photos]);

  const openCluster = useCallback((cluster: RoutePhotoCluster) => {
    setSelectedCluster(cluster);
  }, []);

  const closeCluster = useCallback(() => {
    setSelectedCluster(null);
  }, []);

  return {
    closeCluster,
    clusters,
    isLoading,
    openCluster,
    photos,
    reload,
    selectedCluster,
  };
}
