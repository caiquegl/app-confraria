import { formatRouteDistance, formatRouteDuration } from "./route-format.utils";

function extractRegionLabel(route: import("../types/saved-route.types").RouteApiResponse) {
  for (const day of route.days) {
    const destination = day.places.find((place) => place.role === "destination");
    if (destination?.region) {
      return destination.region;
    }

    const origin = day.places.find((place) => place.role === "origin");
    if (origin?.region) {
      return origin.region;
    }
  }

  return null;
}

export function mapApiRouteToSavedRoute(route: import("../types/saved-route.types").RouteApiResponse) {
  const startsAtDate = new Date(route.startsAt);
  const tripDate = Number.isNaN(startsAtDate.getTime())
    ? ""
    : startsAtDate.toISOString().slice(0, 10);
  const tripTime = Number.isNaN(startsAtDate.getTime())
    ? ""
    : startsAtDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
      });

  return {
    avoidTolls: route.avoidTolls,
    avoidUnpaved: route.avoidUnpaved ?? true,
    bikeId: route.bike.id,
    bikeName: route.bike.name,
    coverImageUrl: route.coverImageUrl ?? null,
    createdAt: route.createdAt,
    creator: route.createdBy
      ? {
          avatarUrl: route.createdBy.avatarUrl,
          id: route.createdBy.id,
          name: route.createdBy.name,
        }
      : null,
    dayCount: route.days.length,
    days: route.days.map((day) => ({
      dayNumber: day.dayNumber,
      id: day.id,
      label: day.label,
      overnight: day.overnight ?? false,
    })),
    destinationLabel: route.destinationLabel,
    distanceLabel: formatRouteDistance(route.distanceMeters),
    durationLabel: formatRouteDuration(route.durationSeconds),
    finishedAt: route.finishedAt,
    fuelCost: route.fuelCost,
    hasOvernight: route.days.some((day) => day.overnight),
    id: route.id,
    kind: route.kind ?? "planned",
    myReview: route.myReview ?? null,
    optimizeFuel: route.optimizeFuel,
    originLabel: route.originLabel,
    rating: route.rating,
    regionLabel: extractRegionLabel(route),
    reviewCount: route.reviewCount,
    startsAt: route.startsAt,
    startedAt: route.startedAt ?? null,
    status: route.status,
    thumbnailType: route.thumbnailType ?? "map",
    title: route.title,
    tollCost: route.tollCost,
    tripDate,
    tripNote: route.tripNote,
    tripTime,
    updatedAt: route.updatedAt,
  } satisfies import("../types/saved-route.types").SavedRoute;
}
