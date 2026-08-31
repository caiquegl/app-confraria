import type { RouteCreateCacheSnapshot } from "../types/route-create.types";
import { createRouteDayDraft, createRouteStop } from "./route-day.utils";
import { placeFromReference } from "./route-draft.utils";
import { createDefaultTripSchedule } from "./route-create-cache.storage";
import type { QuickRoutePlannerSnapshot } from "../types/quick-route.types";

export function buildRouteCreateSnapshotFromQuickRoute(
  snapshot: QuickRoutePlannerSnapshot,
): RouteCreateCacheSnapshot {
  const day = createRouteDayDraft(0);
  day.origin = placeFromReference(snapshot.origin);
  day.destination = placeFromReference(snapshot.destination);
  day.stops = snapshot.stops.map((stop) => ({
    id: createRouteStop().id,
    place: placeFromReference(stop),
  }));
  day.label = "Dia 1";

  return {
    draft: {
      itinerary: {
        activeDayId: day.id,
        days: [day],
      },
      motorcycle: {
        bikeId: null,
      },
      preferences: {
        avoidTolls: false,
        avoidUnpaved: true,
        optimizeFuel: true,
        routeStyle: snapshot.routeStyle ?? "direct",
      },
    },
    sheetState: "normal",
    step: 1,
    tripSchedule: createDefaultTripSchedule(),
    version: 1,
  };
}
