import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { decodeEncodedPolyline, fetchPlaceDirections } from "@/lib/places";
import type { PlaceDirectionsStep } from "@/lib/places";

import { fetchRoute } from "../services/routes.service";
import { setActiveNavigationRouteId } from "../stores/active-navigation-store";
import type { RouteApiResponse } from "../types/saved-route.types";
import { captureRouteError } from "@/lib/sentry";
import { buildRouteWaypointsFromApiRoute } from "../utils/build-route-waypoints";
import {
  bearingBetween,
  findClosestPointOnPolyline,
  formatDurationFromSeconds,
  formatEtaFromSeconds,
  formatNavigationDistance,
  haversineDistanceMeters,
  sumPolylineDistanceMeters,
} from "../utils/navigation-geometry.utils";
import { getManeuverIconName, getManeuverLabel } from "../utils/navigation-maneuver.utils";
import {
  buildManeuverCarouselItems,
  buildStepEndPolylineIndexes,
  computeRemainingDurationSeconds,
  getNextManeuverStep,
  resolveActiveStepIndex,
  type NavigationManeuverPreview,
} from "../utils/navigation-steps.utils";

type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RouteNavigationState = {
  activeStep: PlaceDirectionsStep | null;
  activeStepIndex: number;
  completedPolyline: Coordinate[];
  currentPosition: Coordinate | null;
  error: string | null;
  etaLabel: string;
  heading: number;
  isArrived: boolean;
  isLoading: boolean;
  isOffRoute: boolean;
  maneuverCarousel: NavigationManeuverPreview[];
  maneuverIcon: ReturnType<typeof getManeuverIconName>;
  maneuverLabel: string;
  remainingDistanceLabel: string;
  remainingDistanceMeters: number;
  remainingDurationLabel: string;
  remainingPolyline: Coordinate[];
  route: RouteApiResponse | null;
  routePolyline: Coordinate[];
  totalDistanceMeters: number;
  traveledDistanceMeters: number;
};

const OFF_ROUTE_THRESHOLD_METERS = 80;
const ARRIVAL_THRESHOLD_METERS = 100;
const STEP_ADVANCE_THRESHOLD_METERS = 40;

const INITIAL_STATE: RouteNavigationState = {
  activeStep: null,
  activeStepIndex: 0,
  completedPolyline: [],
  currentPosition: null,
  error: null,
  etaLabel: "--:--",
  heading: 0,
  isArrived: false,
  isLoading: true,
  isOffRoute: false,
  maneuverCarousel: [],
  maneuverIcon: "navigate",
  maneuverLabel: "Preparando navegação...",
  remainingDistanceLabel: "—",
  remainingDistanceMeters: 0,
  remainingDurationLabel: "—",
  remainingPolyline: [],
  route: null,
  routePolyline: [],
  totalDistanceMeters: 0,
  traveledDistanceMeters: 0,
};

type UseRouteNavigationParams = {
  routeId: string;
};

export function useRouteNavigation({ routeId }: UseRouteNavigationParams) {
  const [state, setState] = useState<RouteNavigationState>(INITIAL_STATE);
  const [followUser, setFollowUser] = useState(true);

  const stepsRef = useRef<PlaceDirectionsStep[]>([]);
  const stepEndPolylineIndexesRef = useRef<number[]>([]);
  const totalDurationSecondsRef = useRef(0);
  const totalDistanceMetersRef = useRef(0);
  const activeStepIndexRef = useRef(0);
  const previousPositionRef = useRef<Coordinate | null>(null);
  const remainingDurationSecondsRef = useRef(0);
  const routePolylineRef = useRef<Coordinate[]>([]);

  const loadNavigation = useCallback(async () => {
    if (!routeId) {
      setState((current) => ({
        ...current,
        error: "Rota inválida",
        isLoading: false,
      }));
      return;
    }

    setState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const route = await fetchRoute(routeId);

      if (route.status === "finished") {
        setState((current) => ({
          ...current,
          error: "Esta rota já foi finalizada",
          isLoading: false,
          route,
        }));
        return;
      }

      const waypoints = buildRouteWaypointsFromApiRoute(route);
      if (waypoints.length < 2) {
        throw new Error("Rota sem coordenadas suficientes para navegação");
      }

      const directions = await fetchPlaceDirections(waypoints, {
        avoidTolls: route.avoidTolls,
        includeSteps: true,
      });

      const selectedRoute =
        directions.routes.find((item) => item.isDefault) ?? directions.routes[0];

      if (!selectedRoute) {
        throw new Error("Não foi possível calcular a rota");
      }

      const routePolyline = decodeEncodedPolyline(selectedRoute.encodedPolyline);
      const steps = selectedRoute.steps ?? [];

      stepsRef.current = steps;
      stepEndPolylineIndexesRef.current = buildStepEndPolylineIndexes(steps, routePolyline);
      routePolylineRef.current = routePolyline;
      totalDurationSecondsRef.current =
        selectedRoute.durationSeconds ??
        steps.reduce((total, step) => total + (step.durationSeconds ?? 0), 0);
      totalDistanceMetersRef.current =
        selectedRoute.distanceMeters ?? sumPolylineDistanceMeters(routePolyline);
      activeStepIndexRef.current = 0;

      setActiveNavigationRouteId(route.id);

      const initialStep = getNextManeuverStep(steps, 0);
      const initialCarousel = buildManeuverCarouselItems(steps, 0, null, false);

      setState((current) => ({
        ...current,
        activeStep: steps[0] ?? null,
        activeStepIndex: 0,
        error: null,
        isLoading: false,
        maneuverCarousel: initialCarousel,
        maneuverIcon: getManeuverIconName(initialStep?.maneuver),
        maneuverLabel: getManeuverLabel(initialStep?.instructions),
        remainingPolyline: routePolyline,
        route,
        routePolyline,
        totalDistanceMeters: totalDistanceMetersRef.current,
      }));
    } catch (error) {
      captureRouteError(error, {
        routeId,
        screen: "RouteNavigation",
        source: "loadNavigation",
      });
      setState((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar a navegação",
        isLoading: false,
      }));
    }
  }, [routeId]);

  useEffect(() => {
    void loadNavigation();
  }, [loadNavigation]);

  const updateNavigationFromPosition = useCallback((position: Coordinate, heading: number) => {
    const routePolyline = routePolylineRef.current;
    if (routePolyline.length < 2) return;

    const closest = findClosestPointOnPolyline(position, routePolyline);
    const isOffRoute = closest.distanceMeters > OFF_ROUTE_THRESHOLD_METERS;
    const traveledDistanceMeters = sumPolylineDistanceMeters(
      routePolyline,
      closest.index,
    );
    const remainingDistanceMeters = Math.max(
      0,
      totalDistanceMetersRef.current - traveledDistanceMeters,
    );

    const steps = stepsRef.current;
    const activeStepIndex = resolveActiveStepIndex(
      closest.index,
      stepEndPolylineIndexesRef.current,
      position,
      steps,
      STEP_ADVANCE_THRESHOLD_METERS,
    );

    activeStepIndexRef.current = activeStepIndex;
    const activeStep = steps[activeStepIndex] ?? null;
    const displayStep = getNextManeuverStep(steps, activeStepIndex);

    const remainingDurationSeconds = computeRemainingDurationSeconds({
      activeStepIndex,
      position,
      remainingDistanceMeters,
      steps,
      totalDistanceMeters: totalDistanceMetersRef.current,
      totalDurationSeconds: totalDurationSecondsRef.current,
    });

    const destination = routePolyline[routePolyline.length - 1];
    const distanceToDestination = haversineDistanceMeters(position, destination);
    const isArrived = distanceToDestination <= ARRIVAL_THRESHOLD_METERS;

    const maneuverCarousel = buildManeuverCarouselItems(
      steps,
      activeStepIndex,
      position,
      isOffRoute,
    );

    const completedPolyline = routePolyline.slice(0, closest.index + 1);
    const remainingPolyline = routePolyline.slice(closest.index);

    remainingDurationSecondsRef.current = remainingDurationSeconds;

    setState((current) => ({
      ...current,
      activeStep,
      activeStepIndex,
      completedPolyline,
      currentPosition: position,
      etaLabel: formatEtaFromSeconds(remainingDurationSeconds),
      heading,
      isArrived,
      isOffRoute,
      maneuverCarousel,
      maneuverIcon: getManeuverIconName(displayStep?.maneuver),
      maneuverLabel: getManeuverLabel(displayStep?.instructions),
      remainingDistanceLabel: formatNavigationDistance(remainingDistanceMeters),
      remainingDistanceMeters,
      remainingDurationLabel: formatDurationFromSeconds(remainingDurationSeconds),
      remainingPolyline,
      traveledDistanceMeters,
    }));
  }, []);

  useEffect(() => {
    if (state.isLoading || state.error) return;

    let subscription: Location.LocationSubscription | null = null;

    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setState((current) => ({
          ...current,
          error: "Permissão de localização necessária para navegar",
        }));
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        (update) => {
          const position = {
            latitude: update.coords.latitude,
            longitude: update.coords.longitude,
          };

          const heading =
            update.coords.heading != null && update.coords.heading >= 0
              ? update.coords.heading
              : previousPositionRef.current
                ? bearingBetween(previousPositionRef.current, position)
                : state.heading;

          previousPositionRef.current = position;
          updateNavigationFromPosition(position, heading);
        },
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, [state.error, state.isLoading, state.heading, updateNavigationFromPosition]);

  useEffect(() => {
    if (state.isLoading || state.error) return;

    const interval = setInterval(() => {
      const remainingDurationSeconds = Math.max(0, remainingDurationSecondsRef.current - 30);

      remainingDurationSecondsRef.current = remainingDurationSeconds;

      setState((current) => ({
        ...current,
        etaLabel: formatEtaFromSeconds(remainingDurationSeconds),
        remainingDurationLabel: formatDurationFromSeconds(remainingDurationSeconds),
      }));
    }, 30_000);

    return () => clearInterval(interval);
  }, [state.error, state.isLoading]);

  const recenter = useCallback(() => {
    setFollowUser(true);
  }, []);

  const toggleFollowUser = useCallback((value: boolean) => {
    setFollowUser(value);
  }, []);

  return {
    followUser,
    recenter,
    reload: loadNavigation,
    state,
    toggleFollowUser,
  };
}
