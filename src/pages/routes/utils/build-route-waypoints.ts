import type { RouteApiResponse } from "../types/saved-route.types";

export function buildRouteWaypointsFromApiRoute(route: RouteApiResponse) {
  const waypoints: Array<{ latitude: number; longitude: number }> = [];

  for (const day of route.days) {
    const places = [...day.places].sort((a, b) => a.order - b.order);

    for (const place of places) {
      if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
        continue;
      }

      const last = waypoints[waypoints.length - 1];
      if (
        last &&
        last.latitude === place.latitude &&
        last.longitude === place.longitude
      ) {
        continue;
      }

      waypoints.push({
        latitude: place.latitude,
        longitude: place.longitude,
      });
    }
  }

  return waypoints;
}
