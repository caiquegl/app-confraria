import { useCallback, useEffect, useState } from "react";

import { fetchNearbyPlaces } from "../services/nearby.service";
import {
  NEARBY_CATEGORIES,
  type NearbyCategory,
  type NearbyPlace,
  type Service,
} from "../types/services.types";

export type NearbyServiceSection = {
  category: NearbyCategory;
  services: Service[];
};

export function nearbyPlaceToService(place: NearbyPlace): Service {
  return {
    address: place.address,
    category: place.category,
    googlePlaceId: place.googlePlaceId,
    googleRating: place.googleRating,
    googleRatingCount: place.googleRatingCount,
    id: place.googlePlaceId,
    imageUrl: null,
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    phone: place.phone,
    rating: place.googleRating ?? 0,
    reviewCount: place.googleRatingCount ?? 0,
    source: "google",
  };
}

export function useNearbyServices(
  coords: {
    latitude: number | null;
    longitude: number | null;
  },
  enabled: boolean,
) {
  const { latitude, longitude } = coords;
  const [sections, setSections] = useState<NearbyServiceSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || latitude === null || longitude === null) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        NEARBY_CATEGORIES.map(async (category) => {
          try {
            const places = await fetchNearbyPlaces({
              category,
              latitude,
              longitude,
            });
            return { category, services: places.map(nearbyPlaceToService) };
          } catch {
            return { category, services: [] as Service[] };
          }
        }),
      );

      const withResults = results.filter(
        (section) => section.services.length > 0,
      );
      setSections(withResults);

      if (withResults.length === 0) {
        setError("Nenhum local encontrado perto de você.");
      }
    } catch {
      setError("Não foi possível buscar locais próximos.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, latitude, longitude]);

  useEffect(() => {
    load();
  }, [load]);

  return { error, isLoading, refresh: load, sections };
}
