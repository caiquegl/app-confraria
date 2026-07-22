import type { RouteApiResponse } from "../types/saved-route.types";

export function getRouteEffectiveStartedAt(route: Pick<RouteApiResponse, "startedAt" | "startsAt" | "status">): string | null {
  if (route.startedAt) {
    return route.startedAt;
  }

  if (route.status === "in_progress" || route.status === "finished") {
    return route.startsAt;
  }

  return null;
}

export function getRouteTripDurationSeconds(
  route: Pick<RouteApiResponse, "finishedAt" | "startedAt" | "startsAt" | "status">,
  now: Date = new Date(),
): number {
  const startedAtValue = getRouteEffectiveStartedAt(route);
  if (!startedAtValue) {
    return 0;
  }

  const startedAt = new Date(startedAtValue);
  if (Number.isNaN(startedAt.getTime())) {
    return 0;
  }

  const endAt = route.finishedAt ? new Date(route.finishedAt) : now;
  if (Number.isNaN(endAt.getTime())) {
    return 0;
  }

  return Math.max(0, Math.round((endAt.getTime() - startedAt.getTime()) / 1000));
}

export function formatRouteDateTime(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}
