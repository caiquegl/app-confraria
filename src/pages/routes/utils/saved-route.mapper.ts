import { formatRouteDistance, formatRouteDuration } from "./route-format.utils";

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
    bikeId: route.bike.id,
    bikeName: route.bike.name,
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
    optimizeFuel: route.optimizeFuel,
    originLabel: route.originLabel,
    startsAt: route.startsAt,
    status: route.status,
    title: route.title,
    tollCost: route.tollCost,
    tripDate,
    tripNote: route.tripNote,
    tripTime,
    updatedAt: route.updatedAt,
  } satisfies import("../types/saved-route.types").SavedRoute;
}
