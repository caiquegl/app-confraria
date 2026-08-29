import type { CreateRoutePayload, RouteCreateAction, RouteKind } from "../types/saved-route.types";
import type { RouteApiResponse } from "../types/saved-route.types";

function mapPlace(place: RouteApiResponse["days"][number]["places"][number]) {
  return {
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    mainText: place.mainText,
    placeId: place.placeId,
    secondaryText: place.secondaryText ?? "",
  };
}

export function buildCommunityRouteCopyPayload(
  route: RouteApiResponse,
  bikeId: string,
  action: RouteCreateAction,
  kind: RouteKind = "planned",
): CreateRoutePayload {
  return {
    action,
    days: route.days.map((day) => ({
      destination: mapPlace(day.places.find((place) => place.role === "destination")!),
      distanceMeters: day.distanceMeters ?? undefined,
      durationSeconds: day.durationSeconds ?? undefined,
      label: day.label,
      origin: mapPlace(day.places.find((place) => place.role === "origin")!),
      overnight: day.overnight,
      stops: day.places
        .filter((place) => place.role === "stop")
        .sort((left, right) => left.order - right.order)
        .map(mapPlace),
    })),
    kind,
    motorcycle: { bikeId },
    preferences: {
      avoidTolls: route.avoidTolls,
      optimizeFuel: route.optimizeFuel,
    },
    totals: {
      distanceMeters: route.distanceMeters ?? undefined,
      durationSeconds: route.durationSeconds ?? undefined,
      fuelCost: route.fuelCost ?? undefined,
      tollCost: route.tollCost ?? undefined,
    },
  };
}
