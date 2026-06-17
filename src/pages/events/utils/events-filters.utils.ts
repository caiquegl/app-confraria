import { getBrazilianStateName } from "../constants/brazilian-states";
import type { EventsFilterChip } from "../types/events.types";
import {
  DEFAULT_EVENTS_FILTERS,
  type EventsFilters,
} from "../types/events-filters.types";

export const DISTANCE_STEPS = [0, 10, 50, 100, 300, 500, 1000] as const;
export const DISTANCE_MAX_STEP = DISTANCE_STEPS.length - 1;
export const DEFAULT_DISTANCE_RANGE: [number, number] = [0, DISTANCE_MAX_STEP];

export function formatDistanceStep(stepIndex: number) {
  return stepIndex >= DISTANCE_MAX_STEP ? "1000+ km" : `${DISTANCE_STEPS[stepIndex]} km`;
}

export function isFullDistanceRange(range: [number, number]) {
  return range[0] === 0 && range[1] === DISTANCE_MAX_STEP;
}

export function getFilterCategoryFromPill(pillCategory: string) {
  return pillCategory === "Tudo" ? "ALL" : pillCategory;
}

export function getPillFromFilterCategory(filterCategory: string) {
  return filterCategory === "ALL" ? "Tudo" : filterCategory;
}

export function getDistanceKmRange(distanceRange: [number, number]) {
  return {
    maxDistanceKm: DISTANCE_STEPS[distanceRange[1]],
    minDistanceKm: DISTANCE_STEPS[distanceRange[0]],
  };
}

export function haversineKm(
  origin: { latitude: number; longitude: number },
  target: { latitude: number; longitude: number },
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(target.latitude - origin.latitude);
  const dLon = toRadians(target.longitude - origin.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(target.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchesQuickRideDistanceFilter(
  ride: { origin: { latitude: number; longitude: number } },
  userLocation: { latitude: number; longitude: number } | null,
  distanceRange: [number, number],
) {
  if (!userLocation || isFullDistanceRange(distanceRange)) {
    return true;
  }

  const { maxDistanceKm, minDistanceKm } = getDistanceKmRange(distanceRange);
  const distanceKm = haversineKm(userLocation, ride.origin);

  if (distanceKm < minDistanceKm) {
    return false;
  }

  return maxDistanceKm >= 1000 ? true : distanceKm <= maxDistanceKm;
}

export type EventsDiscoverQueryFilters = {
  category?: string;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  minDistanceKm?: number;
  state?: string;
};

export function buildDiscoverQueryFilters(
  filters: EventsFilters,
  userLocation: { latitude: number; longitude: number } | null,
): EventsDiscoverQueryFilters {
  const query: EventsDiscoverQueryFilters = {};

  if (filters.category !== "ALL") {
    query.category = filters.category;
  }

  if (filters.state !== "ALL") {
    query.state = filters.state;
  }

  if (!isFullDistanceRange(filters.distanceRange) && userLocation) {
    const { maxDistanceKm, minDistanceKm } = getDistanceKmRange(filters.distanceRange);
    query.latitude = userLocation.latitude;
    query.longitude = userLocation.longitude;
    query.minDistanceKm = minDistanceKm;
    query.maxDistanceKm = maxDistanceKm;
  }

  return query;
}

export function buildActiveFilterChips(
  filters: EventsFilters,
  onUpdate: (nextFilters: EventsFilters) => void,
): EventsFilterChip[] {
  const chips: EventsFilterChip[] = [];

  if (filters.category !== "ALL") {
    chips.push({
      key: "category",
      label: `Tipo: ${filters.category}`,
      onRemove: () => onUpdate({ ...filters, category: "ALL" }),
    });
  }

  if (filters.state !== "ALL") {
    chips.push({
      key: "state",
      label: `Local: ${getBrazilianStateName(filters.state)}`,
      onRemove: () => onUpdate({ ...filters, state: "ALL" }),
    });
  }

  if (!isFullDistanceRange(filters.distanceRange)) {
    chips.push({
      key: "distance",
      label: `Distância: ${formatDistanceStep(filters.distanceRange[0])} – ${formatDistanceStep(filters.distanceRange[1])}`,
      onRemove: () =>
        onUpdate({
          ...filters,
          distanceRange: DEFAULT_EVENTS_FILTERS.distanceRange,
        }),
    });
  }

  return chips;
}

export function hasAppliedFilters(filters: EventsFilters) {
  return (
    filters.category !== DEFAULT_EVENTS_FILTERS.category ||
    filters.state !== DEFAULT_EVENTS_FILTERS.state ||
    !isFullDistanceRange(filters.distanceRange)
  );
}
