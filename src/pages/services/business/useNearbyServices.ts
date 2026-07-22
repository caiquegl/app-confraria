import { useCallback, useEffect, useRef, useState } from "react";

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

const CACHE_TTL_MS = 3 * 60 * 1000;
const FETCH_CONCURRENCY = 2;
/** ~100m buckets — evita refetch por jitter de GPS */
const COORD_PRECISION = 3;

type NearbyCacheEntry = {
  expiresAt: number;
  sections: NearbyServiceSection[];
};

const nearbyCache = new Map<string, NearbyCacheEntry>();

function isCanceledError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; name?: string };
  return (
    maybe.code === "ERR_CANCELED" ||
    maybe.name === "CanceledError" ||
    maybe.name === "AbortError"
  );
}

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(COORD_PRECISION)}:${longitude.toFixed(COORD_PRECISION)}`;
}

function readCache(latitude: number, longitude: number): NearbyServiceSection[] | null {
  const entry = nearbyCache.get(cacheKey(latitude, longitude));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    nearbyCache.delete(cacheKey(latitude, longitude));
    return null;
  }
  return entry.sections;
}

function writeCache(
  latitude: number,
  longitude: number,
  sections: NearbyServiceSection[],
): void {
  nearbyCache.set(cacheKey(latitude, longitude), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    sections,
  });
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

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
  const latitude =
    coords.latitude == null
      ? null
      : Number(coords.latitude.toFixed(COORD_PRECISION));
  const longitude =
    coords.longitude == null
      ? null
      : Number(coords.longitude.toFixed(COORD_PRECISION));
  const [sections, setSections] = useState<NearbyServiceSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      if (!enabled || latitude === null || longitude === null) {
        return;
      }

      if (!options?.force) {
        const cached = readCache(latitude, longitude);
        if (cached) {
          setSections(cached);
          setError(
            cached.length === 0
              ? "Nenhum local encontrado perto de você."
              : null,
          );
          setIsLoading(false);
          return;
        }
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const results = await mapWithConcurrency(
          NEARBY_CATEGORIES,
          FETCH_CONCURRENCY,
          async (category) => {
            try {
              const places = await fetchNearbyPlaces({
                category,
                latitude,
                longitude,
                signal: controller.signal,
              });
              return { category, services: places.map(nearbyPlaceToService) };
            } catch (error) {
              if (isCanceledError(error) || controller.signal.aborted) {
                throw error;
              }
              return { category, services: [] as Service[] };
            }
          },
        );

        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }

        const withResults = results.filter(
          (section) => section.services.length > 0,
        );
        setSections(withResults);
        writeCache(latitude, longitude, withResults);

        if (withResults.length === 0) {
          setError("Nenhum local encontrado perto de você.");
        }
      } catch (error) {
        if (isCanceledError(error) || controller.signal.aborted) {
          return;
        }
        if (requestId !== requestIdRef.current) {
          return;
        }
        setError("Não foi possível buscar locais próximos.");
      } finally {
        if (requestId === requestIdRef.current && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [enabled, latitude, longitude],
  );

  useEffect(() => {
    if (!enabled || latitude === null || longitude === null) {
      abortRef.current?.abort();
      abortRef.current = null;
      setIsLoading(false);
      return;
    }

    void load();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [enabled, latitude, longitude, load]);

  const refresh = useCallback(() => load({ force: true }), [load]);

  return { error, isLoading, refresh, sections };
}
