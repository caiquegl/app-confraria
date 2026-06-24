import { useEffect, useMemo, useState } from "react";

import { fetchFuelCostEstimate } from "@/lib/places";
import type { FuelCostEstimate } from "@/lib/places/types";

import type { RouteCostEstimate } from "../types/route-cost.types";
import type { RouteDraftDay } from "../types/route-create.types";

type RouteTollSummary = {
  tollAvailable: boolean;
  tollCost: number | null;
  tollCount: number | null;
};

type UseRouteCostEstimateParams = {
  avoidTolls: boolean;
  baseConsumption: number | null;
  days: RouteDraftDay[];
  enabled: boolean;
  tollSummary: RouteTollSummary;
  totalDistanceMeters: number | null;
};

const FUEL_DEBOUNCE_MS = 300;

function getDestinationPlaceId(days: RouteDraftDay[]): string | undefined {
  const lastDay = days[days.length - 1];
  return lastDay?.destination?.placeId?.trim() || undefined;
}

export function useRouteCostEstimate({
  avoidTolls,
  baseConsumption,
  days,
  enabled,
  tollSummary,
  totalDistanceMeters,
}: UseRouteCostEstimateParams): RouteCostEstimate {
  const [fuelEstimate, setFuelEstimate] = useState<FuelCostEstimate | null>(null);
  const [isLoadingFuel, setIsLoadingFuel] = useState(false);

  const destinationPlaceId = useMemo(() => getDestinationPlaceId(days), [days]);

  const fuelRequestKey = useMemo(
    () =>
      [
        enabled ? "on" : "off",
        totalDistanceMeters ?? "none",
        baseConsumption ?? "none",
        destinationPlaceId ?? "none",
      ].join("|"),
    [baseConsumption, destinationPlaceId, enabled, totalDistanceMeters],
  );

  useEffect(() => {
    if (!enabled || totalDistanceMeters == null || !baseConsumption) {
      setFuelEstimate(null);
      setIsLoadingFuel(false);
      return;
    }

    let cancelled = false;
    setIsLoadingFuel(true);

    const timer = setTimeout(() => {
      void fetchFuelCostEstimate({
        baseConsumption,
        destinationPlaceId,
        distanceMeters: totalDistanceMeters,
        fuelType: "gasoline",
      })
        .then((estimate) => {
          if (!cancelled) {
            setFuelEstimate(estimate);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFuelEstimate(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingFuel(false);
          }
        });
    }, FUEL_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [baseConsumption, destinationPlaceId, enabled, fuelRequestKey, totalDistanceMeters]);

  const tollCost = avoidTolls ? 0 : tollSummary.tollCost;
  const tollCount = avoidTolls ? 0 : tollSummary.tollCount;
  const tollAvailable = avoidTolls ? true : tollSummary.tollAvailable;
  const fuelCost = fuelEstimate?.fuelCost ?? null;
  const totalCost =
    fuelCost != null && (avoidTolls || tollCost != null)
      ? fuelCost + (tollCost ?? 0)
      : null;

  return {
    fuel: fuelEstimate,
    fuelCost,
    isLoading: isLoadingFuel,
    tollAvailable,
    tollCost,
    tollCount,
    totalCost,
  };
}
