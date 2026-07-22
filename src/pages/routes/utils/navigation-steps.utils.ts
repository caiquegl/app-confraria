import type { PlaceDirectionsStep } from "@/lib/places";

import {
  findClosestPointOnPolyline,
  formatNavigationDistance,
  haversineDistanceMeters,
} from "./navigation-geometry.utils";
import { getManeuverIconName, getManeuverLabel } from "./navigation-maneuver.utils";

type Coordinate = {
  latitude: number;
  longitude: number;
};

export type NavigationManeuverPreview = {
  distanceLabel: string;
  icon: ReturnType<typeof getManeuverIconName>;
  instruction: string;
  kind: "current" | "off_route" | "upcoming";
  stepIndex: number;
};

const DEFAULT_SPEED_METERS_PER_SECOND = 11.11;
const MAX_CAROUSEL_ITEMS = 8;

function getStepDistanceLabel(
  position: Coordinate | null,
  step: PlaceDirectionsStep,
): string {
  if (!position || step.endLatitude == null || step.endLongitude == null) {
    return "—";
  }

  return formatNavigationDistance(
    haversineDistanceMeters(position, {
      latitude: step.endLatitude,
      longitude: step.endLongitude,
    }),
  );
}

function shouldSkipUpcomingStep(step: PlaceDirectionsStep): boolean {
  const maneuver = step.maneuver?.toUpperCase() ?? "";
  if (maneuver === "DEPART") return true;
  if (maneuver === "STRAIGHT" && !step.instructions?.trim()) return true;
  return false;
}

export function buildManeuverCarouselItems(
  steps: PlaceDirectionsStep[],
  activeStepIndex: number,
  position: Coordinate | null,
  isOffRoute: boolean,
): NavigationManeuverPreview[] {
  const items: NavigationManeuverPreview[] = [];

  if (isOffRoute) {
    items.push({
      distanceLabel: "Retorne ao trajeto",
      icon: "warning-outline",
      instruction: "Você saiu da rota planejada",
      kind: "off_route",
      stepIndex: activeStepIndex,
    });
  }

  for (
    let index = activeStepIndex;
    index < steps.length && items.length < MAX_CAROUSEL_ITEMS;
    index += 1
  ) {
    const step = steps[index];
    if (!step) continue;

    const isCurrentStep = index === activeStepIndex;
    if (!isCurrentStep && shouldSkipUpcomingStep(step)) {
      continue;
    }

    items.push({
      distanceLabel: getStepDistanceLabel(position, step),
      icon: getManeuverIconName(step.maneuver),
      instruction: getManeuverLabel(step.instructions),
      kind: isCurrentStep && !isOffRoute ? "current" : "upcoming",
      stepIndex: index,
    });
  }

  if (items.length === 0 && steps[activeStepIndex]) {
    const step = steps[activeStepIndex];
    items.push({
      distanceLabel: getStepDistanceLabel(position, step),
      icon: getManeuverIconName(step.maneuver),
      instruction: getManeuverLabel(step.instructions),
      kind: "current",
      stepIndex: activeStepIndex,
    });
  }

  return items;
}

export function buildStepEndPolylineIndexes(
  steps: PlaceDirectionsStep[],
  routePolyline: Coordinate[],
): number[] {
  return steps.map((step) => {
    if (step.endLatitude == null || step.endLongitude == null) {
      return 0;
    }

    return findClosestPointOnPolyline(
      { latitude: step.endLatitude, longitude: step.endLongitude },
      routePolyline,
    ).index;
  });
}

export function resolveActiveStepIndex(
  closestPolylineIndex: number,
  stepEndPolylineIndexes: number[],
  position: Coordinate,
  steps: PlaceDirectionsStep[],
  advanceThresholdMeters: number,
): number {
  let index = 0;

  while (index < steps.length - 1) {
    const step = steps[index];
    const endIndex = stepEndPolylineIndexes[index] ?? 0;

    const passedByPolyline = closestPolylineIndex >= endIndex;
    const passedByDistance =
      step.endLatitude != null &&
      step.endLongitude != null &&
      haversineDistanceMeters(position, {
        latitude: step.endLatitude,
        longitude: step.endLongitude,
      }) <= advanceThresholdMeters;

    if (passedByPolyline || passedByDistance) {
      index += 1;
      continue;
    }

    break;
  }

  return index;
}

export function computeRemainingDurationSeconds(params: {
  activeStepIndex: number;
  position: Coordinate;
  remainingDistanceMeters: number;
  steps: PlaceDirectionsStep[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
}): number {
  const {
    activeStepIndex,
    position,
    remainingDistanceMeters,
    steps,
    totalDistanceMeters,
    totalDurationSeconds,
  } = params;

  let fromSteps = 0;

  for (let index = activeStepIndex; index < steps.length; index += 1) {
    const step = steps[index];
    const stepDuration = step.durationSeconds ?? 0;
    const stepDistance = step.distanceMeters ?? 0;

    if (stepDuration <= 0) {
      continue;
    }

    if (index === activeStepIndex && stepDistance > 0 && step.endLatitude != null && step.endLongitude != null) {
      const distanceToStepEnd = haversineDistanceMeters(position, {
        latitude: step.endLatitude,
        longitude: step.endLongitude,
      });
      const ratio = Math.max(0, Math.min(1, distanceToStepEnd / stepDistance));
      fromSteps += stepDuration * ratio;
      continue;
    }

    fromSteps += stepDuration;
  }

  if (fromSteps > 0) {
    return fromSteps;
  }

  if (totalDistanceMeters > 0 && totalDurationSeconds > 0) {
    return (remainingDistanceMeters / totalDistanceMeters) * totalDurationSeconds;
  }

  if (remainingDistanceMeters <= 0) {
    return 0;
  }

  return remainingDistanceMeters / DEFAULT_SPEED_METERS_PER_SECOND;
}

export function getNextManeuverStep(
  steps: PlaceDirectionsStep[],
  activeStepIndex: number,
): PlaceDirectionsStep | null {
  if (steps.length === 0) {
    return null;
  }

  const current = steps[activeStepIndex] ?? null;
  if (!current) {
    return steps[0] ?? null;
  }

  const maneuver = current.maneuver?.toUpperCase() ?? "";
  if (
    (maneuver === "DEPART" || maneuver === "STRAIGHT" || !current.instructions?.trim()) &&
    activeStepIndex < steps.length - 1
  ) {
    return steps[activeStepIndex + 1] ?? current;
  }

  return current;
}
