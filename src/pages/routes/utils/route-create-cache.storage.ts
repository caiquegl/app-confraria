import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  RouteCreateCacheSnapshot,
  RouteCreateDraft,
  RouteCreateTripSchedule,
  SheetState,
  TripIntent,
  WizardStep,
} from "../types/route-create.types";
import { createInitialRouteCreateDraft } from "./route-draft.utils";

const ROUTE_CREATE_CACHE_KEY = "@confraria/route-create-wizard";
const ROUTE_CREATE_CACHE_VERSION = 1 as const;

function isWizardStep(value: unknown): value is WizardStep {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isSheetState(value: unknown): value is SheetState {
  return value === "compact" || value === "normal" || value === "full";
}

function isTripIntent(value: unknown): value is TripIntent {
  return value === "later" || value === "now";
}

function isRoutePlace(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const place = value as Record<string, unknown>;
  return typeof place.description === "string";
}

function isRouteDraftDay(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const day = value as Record<string, unknown>;
  return (
    typeof day.id === "string" &&
    typeof day.label === "string" &&
    Array.isArray(day.stops) &&
    day.stops.every(
      (stop) =>
        stop &&
        typeof stop === "object" &&
        typeof (stop as Record<string, unknown>).id === "string" &&
        ((stop as Record<string, unknown>).place === null ||
          isRoutePlace((stop as Record<string, unknown>).place)),
    ) &&
    (day.origin === null || isRoutePlace(day.origin)) &&
    (day.destination === null || isRoutePlace(day.destination))
  );
}

function isRouteCreateDraft(value: unknown): value is RouteCreateDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  const itinerary = draft.itinerary as Record<string, unknown> | undefined;
  const motorcycle = draft.motorcycle as Record<string, unknown> | undefined;
  const preferences = draft.preferences as Record<string, unknown> | undefined;

  if (!itinerary || !motorcycle || !preferences) return false;
  if (typeof itinerary.activeDayId !== "string") return false;
  if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) return false;
  if (!itinerary.days.every(isRouteDraftDay)) return false;
  if (typeof motorcycle.bikeId !== "string" && motorcycle.bikeId !== null) return false;
  if (typeof preferences.avoidTolls !== "boolean") return false;
  if (typeof preferences.optimizeFuel !== "boolean") return false;

  return true;
}

function isTripSchedule(value: unknown): value is RouteCreateTripSchedule {
  if (!value || typeof value !== "object") return false;
  const schedule = value as Record<string, unknown>;
  return (
    typeof schedule.tripDate === "string" &&
    typeof schedule.tripNote === "string" &&
    typeof schedule.tripTime === "string" &&
    isTripIntent(schedule.tripIntent)
  );
}

export function parseRouteCreateCacheSnapshot(raw: string): RouteCreateCacheSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version !== ROUTE_CREATE_CACHE_VERSION) return null;
    if (!isWizardStep(parsed.step)) return null;
    if (!isSheetState(parsed.sheetState)) return null;
    if (!isRouteCreateDraft(parsed.draft)) return null;
    if (!isTripSchedule(parsed.tripSchedule)) return null;

    return {
      draft: parsed.draft,
      sheetState: parsed.sheetState,
      step: parsed.step,
      tripSchedule: parsed.tripSchedule,
      version: ROUTE_CREATE_CACHE_VERSION,
    };
  } catch {
    return null;
  }
}

export function buildRouteCreateCacheSnapshot({
  draft,
  sheetState,
  step,
  tripSchedule,
}: Omit<RouteCreateCacheSnapshot, "version">): RouteCreateCacheSnapshot {
  return {
    draft,
    sheetState,
    step,
    tripSchedule,
    version: ROUTE_CREATE_CACHE_VERSION,
  };
}

export function serializeRouteCreateCacheSnapshot(
  snapshot: Omit<RouteCreateCacheSnapshot, "version">,
): string {
  return JSON.stringify(buildRouteCreateCacheSnapshot(snapshot));
}

export function createDefaultTripSchedule(): RouteCreateTripSchedule {
  return {
    tripDate: "",
    tripIntent: "later",
    tripNote: "",
    tripTime: "",
  };
}

export async function loadRouteCreateCache(): Promise<RouteCreateCacheSnapshot | null> {
  const raw = await AsyncStorage.getItem(ROUTE_CREATE_CACHE_KEY);
  if (!raw) return null;
  return parseRouteCreateCacheSnapshot(raw);
}

export async function saveRouteCreateCache(snapshot: RouteCreateCacheSnapshot): Promise<void> {
  await AsyncStorage.setItem(ROUTE_CREATE_CACHE_KEY, JSON.stringify(snapshot));
}

export async function clearRouteCreateCache(): Promise<void> {
  await AsyncStorage.removeItem(ROUTE_CREATE_CACHE_KEY);
}

export function createFreshRouteCreateSnapshot(
  initialOriginLabel?: string | null,
  initialOriginCoords?: { latitude: number; longitude: number } | null,
): RouteCreateCacheSnapshot {
  return buildRouteCreateCacheSnapshot({
    draft: createInitialRouteCreateDraft(initialOriginLabel, initialOriginCoords),
    sheetState: "normal",
    step: 1,
    tripSchedule: createDefaultTripSchedule(),
  });
}
