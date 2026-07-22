import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager } from "react-native";

import { decodeEncodedPolyline, fetchPlaceDirections } from "@/lib/places";

import type { RouteDraftDay } from "../types/route-create.types";
import { buildDayWaypoints } from "../utils/route-draft.utils";
import { formatRouteDistance, formatRouteDuration } from "../utils/route-format.utils";

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RoutePathOption = {
  coordinates: RouteCoordinate[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  encodedPolyline: string;
  id: string;
  isDefault: boolean;
  label: string;
  tollAvailable: boolean;
  tollCost: number | null;
  tollCount: number | null;
};

type DayRoutePlan = {
  dayId: string;
  dayIndex: number;
  options: RoutePathOption[];
  selectedOptionId: string | null;
  waypointsKey: string;
};

const ROUTE_DEBOUNCE_MS = 500;
const SELECTED_POLYLINE_MAX_POINTS = 160;
const ALTERNATIVE_POLYLINE_MAX_POINTS = 64;

function formatDistance(distanceMeters: number | null): string | null {
  if (distanceMeters == null) return null;
  return formatRouteDistance(distanceMeters);
}

function formatDuration(durationSeconds: number | null): string | null {
  if (durationSeconds == null) return null;
  return formatRouteDuration(durationSeconds);
}

function buildRouteOptionLabel(
  option: Pick<RoutePathOption, "distanceMeters" | "durationSeconds" | "isDefault">,
  index: number,
): string {
  const parts = [option.isDefault ? `Rota ${index + 1}` : `Alternativa ${index + 1}`];
  const duration = formatDuration(option.durationSeconds);
  const distance = formatDistance(option.distanceMeters);

  if (duration) parts.push(duration);
  if (distance) parts.push(distance);

  return parts.join(" · ");
}

/** Downsample for MapView — full decode is expensive and rarely needed at pixel density. */
function simplifyPolyline(
  coordinates: RouteCoordinate[],
  maxPoints: number,
): RouteCoordinate[] {
  if (coordinates.length <= maxPoints) {
    return coordinates;
  }

  const result: RouteCoordinate[] = [];
  const step = (coordinates.length - 1) / (maxPoints - 1);

  for (let index = 0; index < maxPoints - 1; index += 1) {
    result.push(coordinates[Math.round(index * step)]);
  }

  result.push(coordinates[coordinates.length - 1]);
  return result;
}

function mergeCoordinates(segments: RouteCoordinate[][]): RouteCoordinate[] {
  const merged: RouteCoordinate[] = [];

  segments.forEach((segment) => {
    segment.forEach((point, index) => {
      if (index === 0 && merged.length > 0) {
        const last = merged[merged.length - 1];
        if (last.latitude === point.latitude && last.longitude === point.longitude) {
          return;
        }
      }

      merged.push(point);
    });
  });

  return merged;
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

type UseRouteDirectionsParams = {
  activeDayId: string;
  avoidTolls?: boolean;
  days: RouteDraftDay[];
  enabled?: boolean;
};

export function useRouteDirections({
  activeDayId,
  avoidTolls = false,
  days,
  enabled = true,
}: UseRouteDirectionsParams) {
  const [dayPlans, setDayPlans] = useState<DayRoutePlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dayPlansRef = useRef(dayPlans);
  dayPlansRef.current = dayPlans;

  const dayWaypointPlans = useMemo(
    () =>
      days.map((day, dayIndex) => {
        const waypoints = buildDayWaypoints(days, dayIndex);
        return {
          dayId: day.id,
          dayIndex,
          waypoints,
          waypointsKey: JSON.stringify(waypoints),
        };
      }),
    [days],
  );

  const plansKey = useMemo(
    () =>
      `${dayWaypointPlans.map((plan) => `${plan.dayId}:${plan.waypointsKey}`).join("|")}|avoidTolls:${avoidTolls}`,
    [avoidTolls, dayWaypointPlans],
  );

  useEffect(() => {
    let cancelled = false;
    let interactionHandle: { cancel: () => void } | null = null;

    if (!enabled) {
      setDayPlans([]);
      setIsLoading(false);
      return;
    }

    const validPlans = dayWaypointPlans.filter((plan) => plan.waypoints.length >= 2);
    const validDayIds = new Set(validPlans.map((plan) => plan.dayId));

    if (validPlans.length === 0) {
      setDayPlans([]);
      setIsLoading(false);
      return;
    }

    const plansToFetch = validPlans.filter((plan) => {
      const existing = dayPlansRef.current.find((item) => item.dayId === plan.dayId);
      return !existing || existing.waypointsKey !== plan.waypointsKey;
    });

    // Drop days that no longer have enough waypoints; keep the rest (stale-while-revalidate).
    setDayPlans((current) => {
      const next = current.filter((plan) => validDayIds.has(plan.dayId));
      return next.length === current.length ? current : next;
    });

    if (plansToFetch.length === 0) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);

      void Promise.all(
        plansToFetch.map(async (plan) => {
          const response = await fetchPlaceDirections(plan.waypoints, { avoidTolls });
          await yieldToUi();

          const options: RoutePathOption[] = [];

          for (let index = 0; index < response.routes.length; index += 1) {
            const route = response.routes[index];
            const decoded = decodeEncodedPolyline(route.encodedPolyline);
            const maxPoints = route.isDefault
              ? SELECTED_POLYLINE_MAX_POINTS
              : ALTERNATIVE_POLYLINE_MAX_POINTS;

            options.push({
              coordinates: simplifyPolyline(decoded, maxPoints),
              distanceMeters: route.distanceMeters,
              durationSeconds: route.durationSeconds,
              encodedPolyline: route.encodedPolyline,
              id: `${plan.dayId}-${route.id}`,
              isDefault: route.isDefault,
              label: buildRouteOptionLabel(
                {
                  distanceMeters: route.distanceMeters,
                  durationSeconds: route.durationSeconds,
                  isDefault: route.isDefault,
                },
                index,
              ),
              tollAvailable: route.tollAvailable,
              tollCost: route.tollCost,
              tollCount: route.tollCount,
            });

            // Yield between alternative decodes so the sheet stays responsive.
            if (index < response.routes.length - 1) {
              await yieldToUi();
            }
          }

          return {
            dayId: plan.dayId,
            dayIndex: plan.dayIndex,
            options,
            selectedOptionId: options.find((option) => option.isDefault)?.id ?? options[0]?.id ?? null,
            waypointsKey: plan.waypointsKey,
          } satisfies DayRoutePlan;
        }),
      )
        .then((fetchedPlans) => {
          if (cancelled) return;

          interactionHandle = InteractionManager.runAfterInteractions(() => {
            if (cancelled) return;

            setDayPlans((current) => {
              const byId = new Map(current.map((plan) => [plan.dayId, plan]));

              fetchedPlans.forEach((plan) => {
                const previous = byId.get(plan.dayId);
                const stillValid =
                  previous?.selectedOptionId &&
                  plan.options.some((option) => option.id === previous.selectedOptionId);

                byId.set(plan.dayId, {
                  ...plan,
                  selectedOptionId: stillValid
                    ? previous.selectedOptionId
                    : plan.selectedOptionId,
                });
              });

              return validPlans.map((plan) => {
                const existing = byId.get(plan.dayId);
                if (existing && existing.waypointsKey === plan.waypointsKey) {
                  return { ...existing, dayIndex: plan.dayIndex };
                }
                return (
                  existing ?? {
                    dayId: plan.dayId,
                    dayIndex: plan.dayIndex,
                    options: [],
                    selectedOptionId: null,
                    waypointsKey: plan.waypointsKey,
                  }
                );
              });
            });

            setIsLoading(false);
          });
        })
        .catch(() => {
          if (!cancelled) {
            // Keep previous polylines on failure — clearing freezes UX for no benefit.
            setIsLoading(false);
          }
        });
    }, ROUTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      interactionHandle?.cancel();
    };
  }, [avoidTolls, dayWaypointPlans, enabled, plansKey]);

  const selectRouteOption = useCallback((optionId: string) => {
    setDayPlans((current) =>
      current.map((plan) => {
        if (!plan.options.some((option) => option.id === optionId)) {
          return plan;
        }

        return {
          ...plan,
          selectedOptionId: optionId,
        };
      }),
    );
  }, []);

  const activeDayPlan = useMemo(
    () => dayPlans.find((plan) => plan.dayId === activeDayId) ?? null,
    [activeDayId, dayPlans],
  );

  const selectedCoordinates = useMemo(() => {
    const segments = [...dayPlans]
      .sort((left, right) => left.dayIndex - right.dayIndex)
      .map((plan) => {
        const selected = plan.options.find((option) => option.id === plan.selectedOptionId);
        return selected?.coordinates ?? [];
      })
      .filter((segment) => segment.length > 1);

    return mergeCoordinates(segments);
  }, [dayPlans]);

  const alternativeRoutes = useMemo(() => {
    if (!activeDayPlan) return [];

    return activeDayPlan.options
      .filter((option) => option.id !== activeDayPlan.selectedOptionId)
      .map((option) => ({
        coordinates: option.coordinates,
        id: option.id,
        label: option.label,
      }));
  }, [activeDayPlan]);

  const routeSummary = useMemo(() => {
    let totalDistanceMeters = 0;
    let totalDurationSeconds = 0;
    let hasDistance = false;
    let hasDuration = false;

    const daySummaries = [...dayPlans]
      .sort((left, right) => left.dayIndex - right.dayIndex)
      .map((plan) => {
        const selected = plan.options.find((option) => option.id === plan.selectedOptionId);

        if (selected?.distanceMeters != null) {
          totalDistanceMeters += selected.distanceMeters;
          hasDistance = true;
        }

        if (selected?.durationSeconds != null) {
          totalDurationSeconds += selected.durationSeconds;
          hasDuration = true;
        }

        return {
          dayId: plan.dayId,
          dayLabel: days[plan.dayIndex]?.label ?? `Dia ${plan.dayIndex + 1}`,
          distanceMeters: selected?.distanceMeters ?? null,
          durationSeconds: selected?.durationSeconds ?? null,
        };
      });

    return {
      daySummaries,
      totalDistanceMeters: hasDistance ? totalDistanceMeters : null,
      totalDurationSeconds: hasDuration ? totalDurationSeconds : null,
    };
  }, [dayPlans, days]);

  const tollSummary = useMemo(() => {
    let tollCost = 0;
    let tollCount = 0;
    let hasTollCost = false;
    let hasTollCount = false;
    let allAvailable = true;

    [...dayPlans]
      .sort((left, right) => left.dayIndex - right.dayIndex)
      .forEach((plan) => {
        const selected = plan.options.find((option) => option.id === plan.selectedOptionId);
        if (!selected) return;

        if (!selected.tollAvailable) {
          allAvailable = false;
          return;
        }

        if (selected.tollCost != null) {
          tollCost += selected.tollCost;
          hasTollCost = true;
        }

        if (selected.tollCount != null) {
          tollCount += selected.tollCount;
          hasTollCount = true;
        }
      });

    return {
      tollAvailable: allAvailable,
      tollCost: hasTollCost ? tollCost : null,
      tollCount: hasTollCount ? tollCount : null,
    };
  }, [dayPlans]);

  const dayRoutePlans = useMemo(
    () =>
      [...dayPlans]
        .sort((left, right) => left.dayIndex - right.dayIndex)
        .map((plan) => {
          const selected = plan.options.find((option) => option.id === plan.selectedOptionId);
          if (!selected?.encodedPolyline || selected.distanceMeters == null) {
            return null;
          }

          return {
            dayId: plan.dayId,
            distanceMeters: selected.distanceMeters,
            encodedPolyline: selected.encodedPolyline,
          };
        })
        .filter((plan): plan is NonNullable<typeof plan> => plan != null),
    [dayPlans],
  );

  return {
    alternativeRoutes,
    dayRoutePlans,
    daySummaries: routeSummary.daySummaries,
    isLoading,
    selectRouteOption,
    selectedCoordinates,
    tollSummary,
    totalDistanceMeters: routeSummary.totalDistanceMeters,
    totalDurationSeconds: routeSummary.totalDurationSeconds,
  };
}
