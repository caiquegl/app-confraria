import type { RouteStopSuggestion } from "@/lib/places";

import type { RouteDraftDay } from "../types/route-create.types";

export function collectDayPlaceIds(day: RouteDraftDay): string[] {
  const ids: string[] = [];

  if (day.origin?.placeId) {
    ids.push(day.origin.placeId);
  }

  if (day.destination?.placeId) {
    ids.push(day.destination.placeId);
  }

  day.stops.forEach((stop) => {
    if (stop.place?.placeId) {
      ids.push(stop.place.placeId);
    }
  });

  return ids;
}

export function isSuggestionAddedToDay(
  suggestion: RouteStopSuggestion,
  day: RouteDraftDay,
): boolean {
  return collectDayPlaceIds(day).includes(suggestion.placeId);
}

export const DEFAULT_BIKE_RANGE_KM = 300;
