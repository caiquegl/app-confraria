import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PlaceReference } from "@/lib/places";
import { resolvePlaceWithCoords } from "@/lib/places";

import type {
  RouteCreateCacheSnapshot,
  RouteCreateDraft,
  RouteCreatePayload,
  RouteCreateTripSchedule,
  RouteDraftDay,
  RouteMotorcycleDraft,
  RoutePreferencesDraft,
  SheetState,
  TripIntent,
  WizardStep,
} from "../types/route-create.types";
import {
  createRouteDayDraft,
  createRouteStop,
  cycleSheetState,
} from "../utils/route-day.utils";
import {
  buildRouteCreateCacheSnapshot,
  clearRouteCreateCache,
  createDefaultTripSchedule,
  loadRouteCreateCache,
  saveRouteCreateCache,
} from "../utils/route-create-cache.storage";
import {
  applyWaypointOrder,
  buildMapMarkersFromDraft,
  buildRouteCreatePayload,
  canCompleteStep1,
  canCompleteStep2,
  canCompleteStep3,
  canCompleteStep4,
  createInitialRouteCreateDraft,
  getDayOrigin,
  placeFromReference,
  type RouteWaypointOrderItem,
} from "../utils/route-draft.utils";

const ROUTE_CREATE_CACHE_DEBOUNCE_MS = 300;

type UseRouteCreateDraftParams = {
  editRouteId?: string | null;
  initialOriginCoords?: { latitude: number; longitude: number } | null;
  initialOriginLabel?: string | null;
  initialSnapshot?: RouteCreateCacheSnapshot | null;
};

export function useRouteCreateDraft({
  editRouteId = null,
  initialOriginCoords = null,
  initialOriginLabel = null,
  initialSnapshot = null,
}: UseRouteCreateDraftParams = {}) {
  const [draft, setDraft] = useState<RouteCreateDraft>(() =>
    createInitialRouteCreateDraft(initialOriginLabel, initialOriginCoords),
  );
  const [step, setStep] = useState<WizardStep>(1);
  const [sheetState, setSheetState] = useState<SheetState>("normal");
  const [tripSchedule, setTripSchedule] = useState<RouteCreateTripSchedule>(
    createDefaultTripSchedule,
  );
  const [isCacheReady, setIsCacheReady] = useState(false);

  const skipNextSaveRef = useRef(true);
  const latestSnapshotRef = useRef<RouteCreateCacheSnapshot | null>(null);
  const shouldPersistCacheRef = useRef(false);

  const { activeDayId, days } = draft.itinerary;

  const cacheSnapshot = useMemo(
    () =>
      buildRouteCreateCacheSnapshot({
        draft,
        sheetState,
        step,
        tripSchedule,
      }),
    [draft, sheetState, step, tripSchedule],
  );

  useEffect(() => {
    latestSnapshotRef.current = cacheSnapshot;
  }, [cacheSnapshot]);

  useEffect(() => {
    shouldPersistCacheRef.current =
      isCacheReady && !initialSnapshot && !editRouteId;
  }, [editRouteId, initialSnapshot, isCacheReady]);

  useEffect(() => {
    let cancelled = false;

    if (initialSnapshot) {
      setDraft(initialSnapshot.draft);
      setStep(initialSnapshot.step);
      setSheetState(initialSnapshot.sheetState);
      setTripSchedule(initialSnapshot.tripSchedule);
      skipNextSaveRef.current = true;
      setIsCacheReady(true);
      return () => {
        cancelled = true;
      };
    }

    void loadRouteCreateCache().then((snapshot) => {
      if (cancelled) return;

      if (snapshot && !editRouteId) {
        setDraft(snapshot.draft);
        setStep(snapshot.step);
        setSheetState(snapshot.sheetState);
        setTripSchedule(snapshot.tripSchedule);
      }

      skipNextSaveRef.current = true;
      setIsCacheReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [editRouteId, initialSnapshot]);

  // Debounced persist without JSON.stringify on the hot path (step clicks / typing).
  useEffect(() => {
    if (!isCacheReady || initialSnapshot || editRouteId) return;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const snapshot = latestSnapshotRef.current;
      if (!snapshot) return;
      void saveRouteCreateCache(snapshot);
    }, ROUTE_CREATE_CACHE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [draft, editRouteId, initialSnapshot, isCacheReady, step, tripSchedule]);

  useEffect(() => {
    return () => {
      if (!shouldPersistCacheRef.current) return;
      const snapshot = latestSnapshotRef.current;
      if (snapshot) {
        void saveRouteCreateCache(snapshot);
      }
    };
  }, []);

  const activeDayIndex = useMemo(
    () => Math.max(0, days.findIndex((day) => day.id === activeDayId)),
    [activeDayId, days],
  );

  const updateDay = useCallback(
    (dayId: string, updater: (day: RouteDraftDay) => RouteDraftDay) => {
      setDraft((current) => ({
        ...current,
        itinerary: {
          ...current.itinerary,
          days: current.itinerary.days.map((day) =>
            day.id === dayId ? updater(day) : day,
          ),
        },
      }));
    },
    [],
  );

  const resolvePlace = useCallback(async (place: PlaceReference) => {
    try {
      const resolved = await resolvePlaceWithCoords(place);
      return placeFromReference(place, resolved);
    } catch {
      return placeFromReference(place);
    }
  }, []);

  const setDayOrigin = useCallback(
    (dayId: string, place: PlaceReference | null) => {
      const firstDayId = days[0]?.id;
      if (!firstDayId || dayId !== firstDayId) {
        return;
      }

      if (!place) {
        updateDay(dayId, (day) => ({ ...day, origin: null }));
        return;
      }

      void resolvePlace(place).then((resolved) => {
        updateDay(dayId, (day) => ({ ...day, origin: resolved }));
      });
    },
    [days, resolvePlace, updateDay],
  );

  const setDayDestination = useCallback(
    (dayId: string, place: PlaceReference | null) => {
      if (!place) {
        updateDay(dayId, (day) => ({ ...day, destination: null }));
        return;
      }

      void resolvePlace(place).then((resolved) => {
        updateDay(dayId, (day) => ({ ...day, destination: resolved }));
      });
    },
    [resolvePlace, updateDay],
  );

  const setStopPlace = useCallback(
    (dayId: string, stopId: string, place: PlaceReference | null) => {
      if (!place) {
        updateDay(dayId, (day) => ({
          ...day,
          stops: day.stops.map((stop) =>
            stop.id === stopId ? { ...stop, place: null } : stop,
          ),
        }));
        return;
      }

      void resolvePlace(place).then((resolved) => {
        updateDay(dayId, (day) => ({
          ...day,
          stops: day.stops.map((stop) =>
            stop.id === stopId ? { ...stop, place: resolved } : stop,
          ),
        }));
      });
    },
    [resolvePlace, updateDay],
  );

  const addStopToDay = useCallback((dayId: string) => {
    updateDay(dayId, (day) => ({
      ...day,
      stops: [...day.stops, createRouteStop()],
    }));
  }, [updateDay]);

  const addSuggestedStopToDay = useCallback(
    (
      dayId: string,
      suggestion: {
        description: string;
        latitude: number;
        longitude: number;
        name: string;
        placeId: string;
        typeLabel: string;
      },
    ) => {
      const stop = createRouteStop();

      updateDay(dayId, (day) => ({
        ...day,
        stops: [
          ...day.stops,
          {
            ...stop,
            place: {
              description: suggestion.description,
              latitude: suggestion.latitude,
              longitude: suggestion.longitude,
              mainText: suggestion.name,
              placeId: suggestion.placeId,
              secondaryText: suggestion.typeLabel,
            },
          },
        ],
      }));
    },
    [updateDay],
  );

  const removeStopFromDay = useCallback((dayId: string, stopId: string) => {
    updateDay(dayId, (day) => ({
      ...day,
      stops: day.stops.filter((stop) => stop.id !== stopId),
    }));
  }, [updateDay]);

  const reorderDayWaypoints = useCallback(
    (dayId: string, orderedItems: RouteWaypointOrderItem[]) => {
      const dayIndex = days.findIndex((day) => day.id === dayId);
      if (dayIndex < 0) {
        return;
      }

      updateDay(dayId, (day) =>
        applyWaypointOrder(day, orderedItems, { lockOrigin: dayIndex > 0 }),
      );
    },
    [days, updateDay],
  );

  const toggleDayOvernight = useCallback((dayId: string) => {
    updateDay(dayId, (day) => ({
      ...day,
      overnight: !day.overnight,
    }));
  }, [updateDay]);

  const addDay = useCallback(() => {
    setDraft((current) => {
      const nextDay = createRouteDayDraft(current.itinerary.days.length);

      return {
        ...current,
        itinerary: {
          activeDayId: nextDay.id,
          days: [...current.itinerary.days, nextDay],
        },
      };
    });
  }, []);

  const removeDay = useCallback(
    (dayId: string) => {
      setDraft((current) => {
        if (current.itinerary.days.length <= 1) {
          return current;
        }

        const nextDays = current.itinerary.days.filter((day) => day.id !== dayId);
        const nextActiveDayId =
          current.itinerary.activeDayId === dayId
            ? nextDays[Math.max(0, nextDays.length - 1)].id
            : current.itinerary.activeDayId;

        return {
          ...current,
          itinerary: {
            activeDayId: nextActiveDayId,
            days: nextDays,
          },
        };
      });
    },
    [],
  );

  const setActiveDayId = useCallback((dayId: string) => {
    setDraft((current) => ({
      ...current,
      itinerary: {
        ...current.itinerary,
        activeDayId: dayId,
      },
    }));
  }, []);

  const setMotorcycleDraft = useCallback((motorcycle: RouteMotorcycleDraft) => {
    setDraft((current) => ({
      ...current,
      motorcycle,
    }));
  }, []);

  const setPreferencesDraft = useCallback((preferences: RoutePreferencesDraft) => {
    setDraft((current) => ({
      ...current,
      preferences,
    }));
  }, []);

  const togglePreference = useCallback((key: keyof RoutePreferencesDraft) => {
    setDraft((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        [key]: !current.preferences[key],
      },
    }));
  }, []);

  const setSelectedBikeId = useCallback((bikeId: string | null) => {
    setDraft((current) => ({
      ...current,
      motorcycle: { bikeId },
    }));
  }, []);

  const toggleSheetState = useCallback(() => {
    setSheetState((current) => cycleSheetState(current));
  }, []);

  const setTripIntent = useCallback((tripIntent: TripIntent) => {
    setTripSchedule((current) => ({
      ...current,
      tripIntent,
    }));
  }, []);

  const setTripDate = useCallback((tripDate: string) => {
    setTripSchedule((current) => ({
      ...current,
      tripDate,
    }));
  }, []);

  const setTripTime = useCallback((tripTime: string) => {
    setTripSchedule((current) => ({
      ...current,
      tripTime,
    }));
  }, []);

  const setTripNote = useCallback((tripNote: string) => {
    setTripSchedule((current) => ({
      ...current,
      tripNote,
    }));
  }, []);

  const clearCache = useCallback(async () => {
    await clearRouteCreateCache();
  }, []);

  const mapMarkers = useMemo(() => buildMapMarkersFromDraft(days), [days]);

  const payload = useMemo(() => buildRouteCreatePayload(draft), [draft]);

  const canContinueStep1 = useMemo(() => canCompleteStep1(draft), [draft]);
  const canContinueStep2 = useMemo(() => canCompleteStep2(draft), [draft]);
  const canContinueStep3 = useMemo(() => canCompleteStep3(draft), [draft]);
  const canContinueStep4 = useMemo(() => canCompleteStep4(draft), [draft]);

  return {
    activeDayId,
    activeDayIndex,
    addDay,
    addStopToDay,
    addSuggestedStopToDay,
    canContinueStep1,
    canContinueStep2,
    canContinueStep3,
    canContinueStep4,
    clearCache,
    days,
    draft,
    getDayOrigin: (dayIndex: number) => getDayOrigin(days, dayIndex),
    editRouteId,
    isCacheReady,
    mapMarkers,
    motorcycle: draft.motorcycle,
    payload,
    preferences: draft.preferences,
    removeDay,
    removeStopFromDay,
    reorderDayWaypoints,
    setActiveDayId,
    setDayDestination,
    setDayOrigin,
    setMotorcycleDraft,
    setPreferencesDraft,
    setSelectedBikeId,
    setSheetState,
    setStep,
    setStopPlace,
    setTripDate,
    setTripIntent,
    setTripNote,
    setTripTime,
    sheetState,
    step,
    toggleDayOvernight,
    togglePreference,
    toggleSheetState,
    tripDate: tripSchedule.tripDate,
    tripIntent: tripSchedule.tripIntent,
    tripNote: tripSchedule.tripNote,
    tripSchedule,
    tripTime: tripSchedule.tripTime,
  };
}

export type { RouteCreateDraft, RouteCreatePayload };
