import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { isTechnicalErrorMessage } from "@/components/ErrorState";
import { appLog } from "@/lib/app-log";
import { decodeEncodedPolyline, fetchPlaceDirections } from "@/lib/places";
import type { PlaceDirectionsStep } from "@/lib/places";
import type { PlaceDirectionsRouteOption } from "@/lib/places/types";
import { captureRouteError } from "@/lib/sentry";
import { isAxiosError } from "axios";

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
  sumPolylineDistanceUpToIndex,
} from "../utils/navigation-geometry.utils";
import {
  createHeadingSmoother,
  headingTauForMovement,
  resolveIsMoving,
} from "../utils/navigation-camera.utils";
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
  rerouteFailed: boolean;
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
  /** m/s — alimenta o zoom e a inclinação adaptativos da câmera. */
  speedMps: number;
  totalDistanceMeters: number;
  traveledDistanceMeters: number;
};

const OFF_ROUTE_THRESHOLD_METERS = 80;
const ARRIVAL_THRESHOLD_METERS = 100;
const STEP_ADVANCE_THRESHOLD_METERS = 40;
const WAYPOINT_PASS_THRESHOLD_METERS = 80;
const OFF_ROUTE_CONFIRM_TICKS = 2;
const REROUTE_COOLDOWN_MS = 15_000;
const REROUTE_DIRECTIONS_TIMEOUT_MS = 18_000;
const REROUTE_MAX_ATTEMPTS = 3;
const MAX_GPS_ACCURACY_METERS = 45;
const HEADING_PUBLISH_INTERVAL_MS = 100;

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
  rerouteFailed: false,
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
  speedMps: 0,
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
  const avoidUnpavedRef = useRef(true);
  const routeStyleRef = useRef<"direct" | "winding" | "super_winding">("direct");
  const headingRef = useRef(0);
  /** Heading da bússola do aparelho (orientação fundida). */
  const compassHeadingRef = useRef<number | null>(null);
  /** m/s — usado para escolher GPS vs bússola. */
  const speedRef = useRef(0);
  /** Em movimento vale o rumo do GPS; parado, a bússola. Com histerese. */
  const isMovingRef = useRef(false);
  const headingSmootherRef = useRef(createHeadingSmoother());
  const lastHeadingPublishAtRef = useRef(0);
  const isReroutingRef = useRef(false);
  const lastRerouteAtRef = useRef(0);
  const offRouteTicksRef = useRef(0);
  const rerouteAttemptIdRef = useRef(0);
  const rerouteAbortRef = useRef<AbortController | null>(null);
  const currentPositionRef = useRef<Coordinate | null>(null);
  const lastAccuracySkipLogAtRef = useRef(0);
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
        rerouteFailed: false,
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
    async (
      position: Coordinate,
      options?: { force?: boolean; source?: "auto" | "manual" },
    ) => {
      const source = options?.source ?? "auto";
      const force = options?.force ?? source === "manual";

      if (isArrivedRef.current || isStoppedRef.current) return;
      if (isReroutingRef.current && !force) return;

      const now = Date.now();
      if (!force && now - lastRerouteAtRef.current < REROUTE_COOLDOWN_MS) return;

      const route = routeRef.current;
      if (!route) return;

      const rerouteWaypoints = buildRerouteWaypoints(position);
      if (rerouteWaypoints.length < 2) return;

      rerouteAbortRef.current?.abort();
      const attemptId = rerouteAttemptIdRef.current + 1;
      rerouteAttemptIdRef.current = attemptId;
      const abortController = new AbortController();
      rerouteAbortRef.current = abortController;

      isReroutingRef.current = true;
      lastRerouteAtRef.current = now;
      const startedAt = Date.now();

      appLog.info(source === "manual" ? "route.reroute.manual" : "route.reroute.start", {
        attemptId,
        routeId,
        source,
        waypoints: rerouteWaypoints.length,
      });

      setState((current) => ({
        ...current,
        isOffRoute: true,
        isRerouting: true,
        rerouteFailed: false,
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

      let lastError: unknown;

      try {
        for (let attempt = 1; attempt <= REROUTE_MAX_ATTEMPTS; attempt += 1) {
          if (attemptId !== rerouteAttemptIdRef.current) {
            appLog.info("route.reroute.stale", { attemptId, routeId });
            return;
          }

          try {
            const directions = await fetchPlaceDirections(rerouteWaypoints, {
              avoidTolls: avoidTollsRef.current,
              avoidUnpaved: avoidUnpavedRef.current,
              includeSteps: true,
              maxAttempts: 1,
              routeStyle: routeStyleRef.current,
              signal: abortController.signal,
              timeoutMs: REROUTE_DIRECTIONS_TIMEOUT_MS,
            });

            if (attemptId !== rerouteAttemptIdRef.current) {
              appLog.info("route.reroute.stale", { attemptId, routeId });
              return;
            }

            const selectedRoute =
              directions.routes.find((item) => item.isDefault) ?? directions.routes[0];

            if (!selectedRoute) {
              throw new Error("Não foi possível recalcular a rota");
            }

            applyDirectionsToNavigation(selectedRoute, route);

            const heading = headingRef.current;
            const routePolyline = routePolylineRef.current;
            if (routePolyline.length >= 2) {
              const closest = findClosestPointOnPolyline(position, routePolyline);
              const traveledDistanceMeters = sumPolylineDistanceUpToIndex(
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
                rerouteFailed: false,
                remainingDistanceLabel: formatNavigationDistance(remainingDistanceMeters),
                remainingDistanceMeters,
                remainingDurationLabel: formatDurationFromSeconds(remainingDurationSeconds),
                remainingPolyline: routePolyline.slice(closest.index),
                traveledDistanceMeters,
              }));
            }

            appLog.info("route.reroute.success", {
              attempt,
              attemptId,
              durationMs: Date.now() - startedAt,
              routeId,
              source,
            });
            return;
          } catch (error) {
            lastError = error;
            if (abortController.signal.aborted || attemptId !== rerouteAttemptIdRef.current) {
              appLog.info("route.reroute.stale", { attemptId, routeId });
              return;
            }

            const isTimeout =
              isAxiosError(error) &&
              (error.code === "ECONNABORTED" || /timeout/i.test(error.message));

            if (attempt < REROUTE_MAX_ATTEMPTS) {
              await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
              continue;
            }

            throw isTimeout
              ? new Error("Tempo esgotado ao recalcular a rota")
              : error;
          }
        }

        throw lastError ?? new Error("Não foi possível recalcular a rota");
      } catch (error) {
        if (attemptId !== rerouteAttemptIdRef.current) {
          return;
        }

        captureRouteError(error, {
          routeId,
          screen: "RouteNavigation",
          source: "rerouteFromPosition",
        });
        appLog.warn("route.reroute.fail", {
          attemptId,
          durationMs: Date.now() - startedAt,
          message: error instanceof Error ? error.message : String(error),
          routeId,
          source,
        });
        setState((current) => ({
          ...current,
          isRerouting: false,
          rerouteFailed: true,
          maneuverCarousel: buildManeuverCarouselItems(
            stepsRef.current,
            activeStepIndexRef.current,
            position,
            true,
            false,
          ),
          maneuverIcon: "warning-outline",
          maneuverLabel: "Falha ao recalcular. Toque em Recalcular agora.",
        }));
      } finally {
        if (attemptId === rerouteAttemptIdRef.current) {
          isReroutingRef.current = false;
        }
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

    setState((current) => ({ ...current, isLoading: true }));

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
      avoidUnpavedRef.current = route.avoidUnpaved ?? true;
      routeStyleRef.current = route.routeStyle ?? "direct";
      isArrivedRef.current = false;

      const directions = await fetchPlaceDirections(waypoints, {
        avoidTolls: route.avoidTolls,
        avoidUnpaved: route.avoidUnpaved ?? true,
        includeSteps: true,
        routeStyle: route.routeStyle ?? "direct",
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
          error instanceof Error && !isTechnicalErrorMessage(error.message)
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
    (
      position: Coordinate,
      heading: number,
      accuracyMeters: number | null = null,
    ) => {
      if (isStoppedRef.current) return;

      currentPositionRef.current = position;

      const routePolyline = routePolylineRef.current;
      if (routePolyline.length < 2) return;

      headingRef.current = heading;
      advancePassedWaypoints(position);

      const closest = findClosestPointOnPolyline(position, routePolyline);
      const hasReliableGps =
        accuracyMeters == null || accuracyMeters <= MAX_GPS_ACCURACY_METERS;
      const isOffRoute =
        hasReliableGps && closest.distanceMeters > OFF_ROUTE_THRESHOLD_METERS;

      if (!hasReliableGps) {
        const now = Date.now();
        if (now - lastAccuracySkipLogAtRef.current >= 30_000) {
          lastAccuracySkipLogAtRef.current = now;
          appLog.info("route.reroute.accuracy_skip", {
            accuracyMeters,
            distanceMeters: Math.round(closest.distanceMeters),
            routeId,
            thresholdMeters: MAX_GPS_ACCURACY_METERS,
          });
        }
      }

      if (isOffRoute) {
        offRouteTicksRef.current += 1;
      } else if (hasReliableGps) {
        offRouteTicksRef.current = 0;
      }

      const traveledDistanceMeters = sumPolylineDistanceUpToIndex(
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
        rerouteFailed: current.rerouteFailed && !isRerouting,
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
        speedMps: speedRef.current,
        traveledDistanceMeters,
      }));

      if (
        isOffRoute &&
        !isArrived &&
        !isRerouting &&
        offRouteTicksRef.current >= OFF_ROUTE_CONFIRM_TICKS
      ) {
        void rerouteFromPosition(position, { source: "auto" });
      }

      if (justArrived) {
        onArrivedRef.current?.();
      }
    },
    [advancePassedWaypoints, rerouteFromPosition, routeId],
  );

  /**
   * Suaviza o rumo bruto e publica no máximo a 10Hz. Sem isso a bússola dispara
   * dezenas de atualizações por segundo e cada uma corta a animação da câmera
   * pela metade, o que aparece como tremor.
   */
  const publishHeading = useCallback((rawHeading: number) => {
    if (!Number.isFinite(rawHeading) || rawHeading < 0) return;

    const smoothed = headingSmootherRef.current.push(rawHeading, {
      tauMs: headingTauForMovement(isMovingRef.current),
    });

    headingRef.current = smoothed;

    const now = Date.now();
    if (now - lastHeadingPublishAtRef.current < HEADING_PUBLISH_INTERVAL_MS) {
      return;
    }
    lastHeadingPublishAtRef.current = now;

    setState((current) =>
      Math.abs(current.heading - smoothed) < 0.01 ? current : { ...current, heading: smoothed },
    );
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

          // Em movimento o rumo vem do GPS: num suporte de moto o magnetômetro
          // sofre com o metal e mede para onde o aparelho aponta, não para onde
          // a moto vai. Parado, a bússola é a única fonte disponível.
          if (!isMovingRef.current) {
            publishHeading(compassHeading);
          }
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
          isMovingRef.current = resolveIsMoving(speed, isMovingRef.current);

          const gpsHeading =
            update.coords.heading != null && update.coords.heading >= 0
              ? update.coords.heading
              : null;

          // Em movimento: rumo real do deslocamento (GPS ou bearing entre fixes).
          // Parado: bússola, já que o GPS não tem rumo confiável sem movimento.
          let rawHeading: number | null = null;
          if (isMovingRef.current) {
            rawHeading =
              gpsHeading ??
              (previousPositionRef.current
                ? bearingBetween(previousPositionRef.current, position)
                : null);
          }
          rawHeading ??= compassHeadingRef.current ?? gpsHeading;

          if (rawHeading != null) {
            publishHeading(rawHeading);
          }

          previousPositionRef.current = position;
          const heading = headingRef.current;
          const accuracy =
            update.coords.accuracy != null && update.coords.accuracy >= 0
              ? update.coords.accuracy
              : null;
          updateNavigationFromPosition(position, heading, accuracy);
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
    rerouteAttemptIdRef.current += 1;
    rerouteAbortRef.current?.abort();
    setState((current) => ({
      ...current,
      isRerouting: false,
      rerouteFailed: false,
    }));
  }, []);

  const resumeNavigationUpdates = useCallback(() => {
    isStoppedRef.current = false;
  }, []);

  const requestReroute = useCallback(() => {
    const position = currentPositionRef.current;
    if (!position) return;
    void rerouteFromPosition(position, { force: true, source: "manual" });
  }, [rerouteFromPosition]);

  return {
    followUser,
    recenter,
    reload: loadNavigation,
    requestReroute,
    resumeNavigationUpdates,
    state,
    stopNavigationUpdates,
    toggleFollowUser,
  };
}
