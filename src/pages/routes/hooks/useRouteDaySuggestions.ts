import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchRouteDaySuggestions } from "@/lib/places";
import type { RouteDaySuggestionsResponse } from "@/lib/places";

import type { RouteDraftDay } from "../types/route-create.types";
import { collectDayPlaceIds, DEFAULT_BIKE_RANGE_KM } from "../utils/route-suggestions.utils";

export type DayRoutePlanSnapshot = {
  dayId: string;
  distanceMeters: number;
  encodedPolyline: string;
};

type UseRouteDaySuggestionsParams = {
  bikeRangeKm?: number | null;
  dayRoutePlans: DayRoutePlanSnapshot[];
  days: RouteDraftDay[];
  enabled?: boolean;
};

const SUGGESTIONS_DEBOUNCE_MS = 500;
const SUGGESTIONS_PAGE_SIZE = 6;

function buildSuggestionRequest(
  plan: DayRoutePlanSnapshot,
  day: RouteDraftDay | undefined,
  bikeRangeKm: number | null | undefined,
  excludePlaceIds: string[],
) {
  return {
    bikeRangeKm: bikeRangeKm ?? DEFAULT_BIKE_RANGE_KM,
    dayId: plan.dayId,
    distanceMeters: plan.distanceMeters,
    encodedPolyline: plan.encodedPolyline,
    excludePlaceIds,
    limit: SUGGESTIONS_PAGE_SIZE,
    overnight: day?.overnight ?? false,
  };
}

export function useRouteDaySuggestions({
  bikeRangeKm,
  dayRoutePlans,
  days,
  enabled = true,
}: UseRouteDaySuggestionsParams) {
  const [suggestionsByDayId, setSuggestionsByDayId] = useState<
    Record<string, RouteDaySuggestionsResponse>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMoreDayId, setLoadingMoreDayId] = useState<string | null>(null);

  const requestKey = useMemo(() => {
    const dayKey = days
      .map((day) => `${day.id}:${day.overnight ? "1" : "0"}:${collectDayPlaceIds(day).join(",")}`)
      .join("|");
    const routeKey = dayRoutePlans
      .map((plan) => `${plan.dayId}:${plan.encodedPolyline.slice(0, 40)}:${plan.distanceMeters}`)
      .join("|");

    return `${dayKey}::${routeKey}::${bikeRangeKm ?? DEFAULT_BIKE_RANGE_KM}`;
  }, [bikeRangeKm, dayRoutePlans, days]);

  useEffect(() => {
    if (!enabled || dayRoutePlans.length === 0) {
      setSuggestionsByDayId({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timer = setTimeout(() => {
      const requests = dayRoutePlans.map((plan) => {
        const day = days.find((item) => item.id === plan.dayId);
        return buildSuggestionRequest(plan, day, bikeRangeKm, day ? collectDayPlaceIds(day) : []);
      });

      void fetchRouteDaySuggestions(requests)
        .then((results) => {
          if (cancelled) return;

          const next: Record<string, RouteDaySuggestionsResponse> = {};
          results.forEach((result) => {
            next[result.dayId] = result;
          });
          setSuggestionsByDayId(next);
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestionsByDayId({});
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bikeRangeKm, dayRoutePlans, days, enabled, requestKey]);

  const loadMoreForDay = useCallback(
    async (dayId: string) => {
      const current = suggestionsByDayId[dayId];
      if (!current?.hasMore || loadingMoreDayId === dayId) {
        return;
      }

      const plan = dayRoutePlans.find((item) => item.dayId === dayId);
      if (!plan) {
        return;
      }

      const day = days.find((item) => item.id === dayId);
      const excludePlaceIds = [
        ...(day ? collectDayPlaceIds(day) : []),
        ...current.suggestions.map((suggestion) => suggestion.placeId),
      ];

      setLoadingMoreDayId(dayId);

      try {
        const [result] = await fetchRouteDaySuggestions([
          buildSuggestionRequest(plan, day, bikeRangeKm, excludePlaceIds),
        ]);

        setSuggestionsByDayId((previous) => {
          const existing = previous[dayId];
          if (!existing) {
            return { ...previous, [dayId]: result };
          }

          const seen = new Set(existing.suggestions.map((item) => item.placeId));
          const mergedSuggestions = [
            ...existing.suggestions,
            ...result.suggestions.filter((item) => !seen.has(item.placeId)),
          ];

          return {
            ...previous,
            [dayId]: {
              ...existing,
              hasMore: result.hasMore,
              suggestions: mergedSuggestions,
            },
          };
        });
      } catch {
        // Keep current list on pagination failure.
      } finally {
        setLoadingMoreDayId(null);
      }
    },
    [bikeRangeKm, dayRoutePlans, days, loadingMoreDayId, suggestionsByDayId],
  );

  const getSuggestionsForDay = useMemo(
    () => (dayId: string) => suggestionsByDayId[dayId] ?? null,
    [suggestionsByDayId],
  );

  const isLoadingMoreForDay = useCallback(
    (dayId: string) => loadingMoreDayId === dayId,
    [loadingMoreDayId],
  );

  return {
    getSuggestionsForDay,
    isLoading,
    isLoadingMoreForDay,
    loadMoreForDay,
    suggestionsByDayId,
  };
}
