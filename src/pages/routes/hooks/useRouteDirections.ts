import { useCallback, useEffect, useMemo, useState } from "react";

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

const ROUTE_DEBOUNCE_MS = 400;

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

type UseRouteDirectionsParams = {
  activeDayId: string;
  avoidTolls?: boolean;
  days: RouteDraftDay[];
};

export function useRouteDirections({
  activeDayId,
  avoidTolls = false,
  days,
}: UseRouteDirectionsParams) {
  const [dayPlans, setDayPlans] = useState<DayRoutePlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dayWaypointPlans = useMemo(
    () =>
      days.map((day, dayIndex) => ({
        dayId: day.id,
        dayIndex,
        waypoints: buildDayWaypoints(days, dayIndex),
        waypointsKey: JSON.stringify(buildDayWaypoints(days, dayIndex)),
      })),
    [days],
  );

  const plansKey = useMemo(
    () =>
      `${dayWaypointPlans.map((plan) => `${plan.dayId}:${plan.waypointsKey}`).join("|")}|avoidTolls:${avoidTolls}`,
    [avoidTolls, dayWaypointPlans],
  );

  useEffect(() => {
    let cancelled = false;

    const plansToFetch = dayWaypointPlans.filter((plan) => plan.waypoints.length >= 2);

    if (plansToFetch.length === 0) {
      setDayPlans([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(() => {
      void Promise.all(
        plansToFetch.map(async (plan) => {
          const response = await fetchPlaceDirections(plan.waypoints, { avoidTolls });

          const options: RoutePathOption[] = response.routes.map((route, index) => ({
            coordinates: decodeEncodedPolyline(route.encodedPolyline),
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
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
          }));

          return {
            dayId: plan.dayId,
            dayIndex: plan.dayIndex,
            options,
            selectedOptionId: options[0]?.id ?? null,
            waypointsKey: plan.waypointsKey,
          } satisfies DayRoutePlan;
        }),
      )
        .then((nextPlans) => {
          if (cancelled) return;

          setDayPlans((current) =>
            nextPlans.map((plan) => {
              const previous = current.find((item) => item.dayId === plan.dayId);
              const stillValid =
                previous?.selectedOptionId &&
                plan.options.some((option) => option.id === previous.selectedOptionId);

              return {
                ...plan,
                selectedOptionId: stillValid
                  ? previous.selectedOptionId
                  : (plan.options.find((option) => option.isDefault)?.id ??
                    plan.options[0]?.id ??
                    null),
              };
            }),
          );
        })
        .catch(() => {
          if (!cancelled) {
            setDayPlans([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    }, ROUTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [avoidTolls, dayWaypointPlans, plansKey]);

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
    const segments = dayPlans
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

    dayPlans
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

  return {
    alternativeRoutes,
    daySummaries: routeSummary.daySummaries,
    isLoading,
    selectRouteOption,
    selectedCoordinates,
    tollSummary,
    totalDistanceMeters: routeSummary.totalDistanceMeters,
    totalDurationSeconds: routeSummary.totalDurationSeconds,
  };
}
