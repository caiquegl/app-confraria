import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { decodeEncodedPolyline, fetchPlaceDirections } from "@/lib/places";
import type { PlaceDirectionsStep } from "@/lib/places";
import type { PlaceDirectionsRouteOption } from "@/lib/places/types";
import { captureRouteError } from "@/lib/sentry";

import { fetchRoute } from "../services/routes.service";
import { setActiveNavigationRouteId } from "../stores/active-navigation-store";
import type { RouteApiResponse } from "../types/saved-route.types";
import {
  buildNavigationPlacePins,
  type RouteNavigationPlacePin,
} from "../utils/build-navigation-place-pins";
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
  isRerouting: boolean;
  maneuverCarousel: NavigationManeuverPreview[];
  maneuverIcon: ReturnType<typeof getManeuverIconName>;
  maneuverLabel: string;
  placePins: RouteNavigationPlacePin[];
  remainingDistanceLabel: string;
  remainingDistanceMeters: number;
  remainingDurationLabel: string;
  remainingPolyline: Coordinate[];
  route: RouteApiResponse | null;
  routePolyline: Coordinate[];
  speedKmh: number | null;
  speedLabel: string;
  totalDistanceMeters: number;
  traveledDistanceMeters: number;
};

const OFF_ROUTE_THRESHOLD_METERS = 80;
const ARRIVAL_THRESHOLD_METERS = 100;
const STEP_ADVANCE_THRESHOLD_METERS = 40;
const WAYPOINT_PASS_THRESHOLD_METERS = 80;
const OFF_ROUTE_CONFIRM_TICKS = 2;
const REROUTE_COOLDOWN_MS = 15_000;

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
  isRerouting: false,
  maneuverCarousel: [],
  maneuverIcon: "navigate",
  maneuverLabel: "Preparando navegação...",
  placePins: [],
  remainingDistanceLabel: "—",
  remainingDistanceMeters: 0,
  remainingDurationLabel: "—",
  remainingPolyline: [],
  route: null,
  routePolyline: [],
  speedKmh: null,
  speedLabel: "—",
  totalDistanceMeters: 0,
  traveledDistanceMeters: 0,
};

type UseRouteNavigationParams = {
  onArrived?: () => void;
  routeId: string;
};

function applySelectedDirectionsRoute(
  selectedRoute: PlaceDirectionsRouteOption,
  routePolyline: Coordinate[],
) {
  const steps = selectedRoute.steps ?? [];
  const totalDurationSeconds =
    selectedRoute.durationSeconds ??
    steps.reduce((total, step) => total + (step.durationSeconds ?? 0), 0);
  const totalDistanceMeters =
    selectedRoute.distanceMeters ?? sumPolylineDistanceMeters(routePolyline);

  return {
    steps,
    stepEndPolylineIndexes: buildStepEndPolylineIndexes(steps, routePolyline),
    totalDistanceMeters,
    totalDurationSeconds,
  };
}

export function useRouteNavigation({ onArrived, routeId }: UseRouteNavigationParams) {
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
  const waypointsRef = useRef<Coordinate[]>([]);
  const nextWaypointIndexRef = useRef(1);
  const avoidTollsRef = useRef(false);
  const headingRef = useRef(0);
  /** Heading da bússola do aparelho (orientação fundida). */
  const compassHeadingRef = useRef<number | null>(null);
  /** m/s — usado para escolher GPS vs bússola. */
  const speedRef = useRef(0);
  const isReroutingRef = useRef(false);
  const lastRerouteAtRef = useRef(0);
  const offRouteTicksRef = useRef(0);
  const isArrivedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const routeRef = useRef<RouteApiResponse | null>(null);
  const onArrivedRef = useRef(onArrived);

  useEffect(() => {
    onArrivedRef.current = onArrived;
  }, [onArrived]);

  const advancePassedWaypoints = useCallback((position: Coordinate) => {
    const waypoints = waypointsRef.current;
    if (waypoints.length < 2) return;

    let nextIndex = nextWaypointIndexRef.current;
    while (nextIndex < waypoints.length - 1) {
      const waypoint = waypoints[nextIndex];
      if (!waypoint) break;
      if (haversineDistanceMeters(position, waypoint) > WAYPOINT_PASS_THRESHOLD_METERS) {
        break;
      }
      nextIndex += 1;
    }
    nextWaypointIndexRef.current = Math.min(nextIndex, waypoints.length - 1);
  }, []);

  const buildRerouteWaypoints = useCallback((position: Coordinate): Coordinate[] => {
    const waypoints = waypointsRef.current;
    if (waypoints.length < 2) return [];

    advancePassedWaypoints(position);
    const remaining = waypoints.slice(nextWaypointIndexRef.current);
    if (remaining.length === 0) {
      return [position, waypoints[waypoints.length - 1]!];
    }

    const firstRemaining = remaining[0]!;
    if (haversineDistanceMeters(position, firstRemaining) < 15) {
      const rest = remaining.slice(1);
      return rest.length > 0 ? [position, ...rest] : [position, firstRemaining];
    }

    return [position, ...remaining];
  }, [advancePassedWaypoints]);

  const applyDirectionsToNavigation = useCallback(
    (selectedRoute: PlaceDirectionsRouteOption, route: RouteApiResponse) => {
      const routePolyline = decodeEncodedPolyline(selectedRoute.encodedPolyline);
      const applied = applySelectedDirectionsRoute(selectedRoute, routePolyline);

      stepsRef.current = applied.steps;
      stepEndPolylineIndexesRef.current = applied.stepEndPolylineIndexes;
      routePolylineRef.current = routePolyline;
      totalDurationSecondsRef.current = applied.totalDurationSeconds;
      totalDistanceMetersRef.current = applied.totalDistanceMeters;
      activeStepIndexRef.current = 0;
      remainingDurationSecondsRef.current = applied.totalDurationSeconds;
      offRouteTicksRef.current = 0;

      const initialStep = getNextManeuverStep(applied.steps, 0);
      const initialCarousel = buildManeuverCarouselItems(applied.steps, 0, null, false, false);

      setState((current) => ({
        ...current,
        activeStep: applied.steps[0] ?? null,
        activeStepIndex: 0,
        completedPolyline: [],
        error: null,
        isLoading: false,
        isOffRoute: false,
        isRerouting: false,
        maneuverCarousel: initialCarousel,
        maneuverIcon: getManeuverIconName(initialStep?.maneuver),
        maneuverLabel: getManeuverLabel(initialStep?.instructions),
        placePins: buildNavigationPlacePins(route),
        remainingDistanceLabel: formatNavigationDistance(applied.totalDistanceMeters),
        remainingDistanceMeters: applied.totalDistanceMeters,
        remainingDurationLabel: formatDurationFromSeconds(applied.totalDurationSeconds),
        remainingPolyline: routePolyline,
        route,
        routePolyline,
        totalDistanceMeters: applied.totalDistanceMeters,
        traveledDistanceMeters: 0,
        etaLabel: formatEtaFromSeconds(applied.totalDurationSeconds),
      }));
    },
    [],
  );

  const rerouteFromPosition = useCallback(
    async (position: Coordinate) => {
      if (isReroutingRef.current || isArrivedRef.current || isStoppedRef.current) return;

      const now = Date.now();
      if (now - lastRerouteAtRef.current < REROUTE_COOLDOWN_MS) return;

      const route = routeRef.current;
      if (!route) return;

      const rerouteWaypoints = buildRerouteWaypoints(position);
      if (rerouteWaypoints.length < 2) return;

      isReroutingRef.current = true;
      lastRerouteAtRef.current = now;

      setState((current) => ({
        ...current,
        isOffRoute: true,
        isRerouting: true,
        maneuverCarousel: buildManeuverCarouselItems(
          stepsRef.current,
          activeStepIndexRef.current,
          position,
          true,
          true,
        ),
        maneuverIcon: "sync-outline",
        maneuverLabel: "Recalculando rota a partir da sua posição",
      }));

      try {
        const directions = await fetchPlaceDirections(rerouteWaypoints, {
          avoidTolls: avoidTollsRef.current,
          includeSteps: true,
        });

        const selectedRoute =
          directions.routes.find((item) => item.isDefault) ?? directions.routes[0];

        if (!selectedRoute) {
          throw new Error("Não foi possível recalcular a rota");
        }

        applyDirectionsToNavigation(selectedRoute, route);

        // Reaplica progresso imediato na nova polyline
        const heading = headingRef.current;
        const routePolyline = routePolylineRef.current;
        if (routePolyline.length >= 2) {
          const closest = findClosestPointOnPolyline(position, routePolyline);
          const traveledDistanceMeters = sumPolylineDistanceMeters(
            routePolyline,
            closest.index,
          );
          const remainingDistanceMeters = Math.max(
            0,
            totalDistanceMetersRef.current - traveledDistanceMeters,
          );
          const remainingDurationSeconds = computeRemainingDurationSeconds({
            activeStepIndex: 0,
            position,
            remainingDistanceMeters,
            steps: stepsRef.current,
            totalDistanceMeters: totalDistanceMetersRef.current,
            totalDurationSeconds: totalDurationSecondsRef.current,
          });
          remainingDurationSecondsRef.current = remainingDurationSeconds;

          setState((current) => ({
            ...current,
            completedPolyline: routePolyline.slice(0, closest.index + 1),
            currentPosition: position,
            etaLabel: formatEtaFromSeconds(remainingDurationSeconds),
            heading,
            isOffRoute: false,
            isRerouting: false,
            remainingDistanceLabel: formatNavigationDistance(remainingDistanceMeters),
            remainingDistanceMeters,
            remainingDurationLabel: formatDurationFromSeconds(remainingDurationSeconds),
            remainingPolyline: routePolyline.slice(closest.index),
            traveledDistanceMeters,
          }));
        }
      } catch (error) {
        captureRouteError(error, {
          routeId,
          screen: "RouteNavigation",
          source: "rerouteFromPosition",
        });
        setState((current) => ({
          ...current,
          isRerouting: false,
          maneuverCarousel: buildManeuverCarouselItems(
            stepsRef.current,
            activeStepIndexRef.current,
            position,
            true,
            false,
          ),
          maneuverIcon: "warning-outline",
          maneuverLabel: "Falha ao recalcular. Tentaremos novamente.",
        }));
      } finally {
        isReroutingRef.current = false;
      }
    },
    [applyDirectionsToNavigation, buildRerouteWaypoints, routeId],
  );

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

      waypointsRef.current = waypoints;
      nextWaypointIndexRef.current = 1;
      avoidTollsRef.current = route.avoidTolls;
      isArrivedRef.current = false;

      const directions = await fetchPlaceDirections(waypoints, {
        avoidTolls: route.avoidTolls,
        includeSteps: true,
      });

      const selectedRoute =
        directions.routes.find((item) => item.isDefault) ?? directions.routes[0];

      if (!selectedRoute) {
        throw new Error("Não foi possível calcular a rota");
      }

      routeRef.current = route;
      setActiveNavigationRouteId(route.id);
      applyDirectionsToNavigation(selectedRoute, route);
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
  }, [applyDirectionsToNavigation, routeId]);

  useEffect(() => {
    void loadNavigation();
  }, [loadNavigation]);

  const updateNavigationFromPosition = useCallback(
    (position: Coordinate, heading: number) => {
      if (isStoppedRef.current) return;

      const routePolyline = routePolylineRef.current;
      if (routePolyline.length < 2) return;

      headingRef.current = heading;
      advancePassedWaypoints(position);

      const closest = findClosestPointOnPolyline(position, routePolyline);
      const isOffRoute = closest.distanceMeters > OFF_ROUTE_THRESHOLD_METERS;

      if (isOffRoute) {
        offRouteTicksRef.current += 1;
      } else {
        offRouteTicksRef.current = 0;
      }

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
      const justArrived = isArrived && !isArrivedRef.current;
      isArrivedRef.current = isArrived;

      const isRerouting = isReroutingRef.current;
      const maneuverCarousel = buildManeuverCarouselItems(
        steps,
        activeStepIndex,
        position,
        isOffRoute || isRerouting,
        isRerouting,
      );

      const completedPolyline = routePolyline.slice(0, closest.index + 1);
      const remainingPolyline = routePolyline.slice(closest.index);

      remainingDurationSecondsRef.current = remainingDurationSeconds;

      const speedKmh =
        speedRef.current > 0 ? Math.round(speedRef.current * 3.6) : null;

      setState((current) => ({
        ...current,
        activeStep,
        activeStepIndex,
        completedPolyline,
        currentPosition: position,
        etaLabel: formatEtaFromSeconds(remainingDurationSeconds),
        heading,
        isArrived,
        isOffRoute: isOffRoute || isRerouting,
        isRerouting,
        maneuverCarousel,
        maneuverIcon: isRerouting
          ? "sync-outline"
          : getManeuverIconName(displayStep?.maneuver),
        maneuverLabel: isRerouting
          ? "Recalculando rota a partir da sua posição"
          : getManeuverLabel(displayStep?.instructions),
        remainingDistanceLabel: formatNavigationDistance(remainingDistanceMeters),
        remainingDistanceMeters,
        remainingDurationLabel: formatDurationFromSeconds(remainingDurationSeconds),
        remainingPolyline,
        speedKmh,
        speedLabel: speedKmh != null ? `${speedKmh} km/h` : "—",
        traveledDistanceMeters,
      }));

      if (
        isOffRoute &&
        !isArrived &&
        !isRerouting &&
        offRouteTicksRef.current >= OFF_ROUTE_CONFIRM_TICKS
      ) {
        void rerouteFromPosition(position);
      }

      if (justArrived) {
        onArrivedRef.current?.();
      }
    },
    [advancePassedWaypoints, rerouteFromPosition],
  );

  const publishHeading = useCallback((heading: number) => {
    const rounded = Math.round(heading);
    if (rounded === Math.round(headingRef.current)) {
      return;
    }
    headingRef.current = heading;
    setState((current) => ({
      ...current,
      heading,
    }));
  }, []);

  useEffect(() => {
    if (state.isLoading || state.error) return;

    let positionSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;

    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setState((current) => ({
          ...current,
          error: "Permissão de localização necessária para navegar",
        }));
        return;
      }

      try {
        headingSubscription = await Location.watchHeadingAsync((update) => {
          const compassHeading =
            update.trueHeading >= 0 ? update.trueHeading : update.magHeading;
          if (!Number.isFinite(compassHeading) || compassHeading < 0) {
            return;
          }

          compassHeadingRef.current = compassHeading;

          // Parado ou em movimento: bússola atualiza o heading para mapa + pin.
          publishHeading(compassHeading);
        });
      } catch {
        // Bússola indisponível — segue só com GPS / bearing.
      }

      positionSubscription = await Location.watchPositionAsync(
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

          const speed =
            update.coords.speed != null && update.coords.speed >= 0
              ? update.coords.speed
              : 0;
          speedRef.current = speed;

          const gpsHeading =
            update.coords.heading != null && update.coords.heading >= 0
              ? update.coords.heading
              : null;

          // Preferência: bússola (mapa + pin no giroscópio). GPS/bearing só se faltar.
          let heading: number;
          if (compassHeadingRef.current != null) {
            heading = compassHeadingRef.current;
          } else if (gpsHeading != null) {
            heading = gpsHeading;
          } else if (previousPositionRef.current) {
            heading = bearingBetween(previousPositionRef.current, position);
          } else {
            heading = headingRef.current;
          }

          previousPositionRef.current = position;
          headingRef.current = heading;
          updateNavigationFromPosition(position, heading);
        },
      );
    })();

    return () => {
      positionSubscription?.remove();
      headingSubscription?.remove();
    };
  }, [publishHeading, state.error, state.isLoading, updateNavigationFromPosition]);

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

  const stopNavigationUpdates = useCallback(() => {
    isStoppedRef.current = true;
    isReroutingRef.current = false;
    offRouteTicksRef.current = 0;
    setState((current) => ({
      ...current,
      isRerouting: false,
    }));
  }, []);

  const resumeNavigationUpdates = useCallback(() => {
    isStoppedRef.current = false;
  }, []);

  return {
    followUser,
    recenter,
    reload: loadNavigation,
    resumeNavigationUpdates,
    state,
    stopNavigationUpdates,
    toggleFollowUser,
  };
}
