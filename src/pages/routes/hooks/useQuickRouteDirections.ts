import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { decodeEncodedPolyline, fetchPlaceDirections } from "@/lib/places";

import type { RoutePathOption } from "./useRouteDirections";
import type { QuickRoutePlace } from "../types/quick-route.types";
import { trackRoutesEvent } from "../utils/track-routes-event";

const ROUTE_DEBOUNCE_MS = 450;

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type UseQuickRouteDirectionsParams = {
  avoidTolls?: boolean;
  destination: QuickRoutePlace | null;
  enabled: boolean;
  /** Incrementado ao limpar a rota — invalida fetch em voo e zera o traçado. */
  resetToken?: number;
  origin: QuickRoutePlace | null;
  stops: QuickRoutePlace[];
};

function simplifyPolyline(
  coordinates: RouteCoordinate[],
  maxPoints: number,
): RouteCoordinate[] {
  if (coordinates.length <= maxPoints) return coordinates;

  const result: RouteCoordinate[] = [];
  const step = (coordinates.length - 1) / (maxPoints - 1);

  for (let index = 0; index < maxPoints - 1; index += 1) {
    result.push(coordinates[Math.round(index * step)]);
  }

  result.push(coordinates[coordinates.length - 1]);
  return result;
}

export function useQuickRouteDirections({
  avoidTolls = false,
  destination,
  enabled,
  origin,
  resetToken = 0,
  stops,
}: UseQuickRouteDirectionsParams) {
  const [options, setOptions] = useState<RoutePathOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedCalculatedRef = useRef(false);
  const requestIdRef = useRef(0);

  const clearDirections = () => {
    requestIdRef.current += 1;
    setOptions([]);
    setSelectedOptionId(null);
    setIsLoading(false);
    setError(null);
    hasTrackedCalculatedRef.current = false;
  };

  const waypoints = useMemo(() => {
    if (!origin || !destination) return [];

    return [
      {
        latitude: origin.latitude,
        longitude: origin.longitude,
        placeId: origin.placeId,
      },
      ...stops.map((stop) => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
        placeId: stop.placeId,
      })),
      {
        latitude: destination.latitude,
        longitude: destination.longitude,
        placeId: destination.placeId,
      },
    ];
  }, [destination, origin, stops]);

  const waypointsKey = useMemo(() => JSON.stringify(waypoints), [waypoints]);

  useLayoutEffect(() => {
    if (!enabled || !destination || waypoints.length < 2) {
      clearDirections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear só quando some destino/reset
  }, [destination, enabled, resetToken, waypoints.length]);

  useEffect(() => {
    if (!enabled || waypoints.length < 2) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      void fetchPlaceDirections(waypoints, { avoidTolls })
        .then((response) => {
          if (requestId !== requestIdRef.current) return;

          const defaultRoute =
            response.routes.find((route) => route.isDefault) ?? response.routes[0];

          if (!defaultRoute) {
            setOptions([]);
            setSelectedOptionId(null);
            setIsLoading(false);
            setError("Não foi possível calcular a rota. Tente novamente.");
            return;
          }

          const decoded = decodeEncodedPolyline(defaultRoute.encodedPolyline);
          const defaultOption: RoutePathOption = {
            coordinates: simplifyPolyline(decoded, 1200),
            distanceMeters: defaultRoute.distanceMeters,
            durationSeconds: defaultRoute.durationSeconds,
            encodedPolyline: defaultRoute.encodedPolyline,
            id: `quick-${defaultRoute.id}-${requestId}`,
            isDefault: true,
            label: "Rota sugerida",
            tollAvailable: defaultRoute.tollAvailable,
            tollCost: defaultRoute.tollCost,
            tollCount: defaultRoute.tollCount,
          };

          setOptions([defaultOption]);
          setSelectedOptionId(defaultOption.id);
          setIsLoading(false);

          if (!hasTrackedCalculatedRef.current) {
            hasTrackedCalculatedRef.current = true;
            trackRoutesEvent("quick_route_calculated", {
              alternatives: 1,
              hasStops: stops.length > 0,
            });
          }
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setOptions([]);
          setSelectedOptionId(null);
          setIsLoading(false);
          setError("Não foi possível calcular a rota. Tente novamente.");
        });
    }, ROUTE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      // Invalida resposta pendente ao trocar waypoints / limpar.
      if (requestId === requestIdRef.current) {
        requestIdRef.current += 1;
      }
    };
  }, [avoidTolls, enabled, resetToken, stops.length, waypoints, waypointsKey]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedOptionId) ?? null,
    [options, selectedOptionId],
  );

  const selectedPolyline = useMemo(() => {
    if (!enabled || !destination) return [];
    return selectedOption?.coordinates ?? [];
  }, [destination, enabled, selectedOption?.coordinates]);

  const etaLabel = useMemo(() => {
    if (!enabled || !destination || !selectedOption?.durationSeconds) return null;
    const eta = new Date(Date.now() + selectedOption.durationSeconds * 1000);
    return eta.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
    });
  }, [destination, enabled, selectedOption?.durationSeconds]);

  return {
    error: enabled && destination ? error : null,
    etaLabel,
    isLoading: enabled && destination ? isLoading : false,
    selectedOption: enabled && destination ? selectedOption : null,
    selectedOptionId: enabled && destination ? selectedOptionId : null,
    selectedPolyline,
  };
}
