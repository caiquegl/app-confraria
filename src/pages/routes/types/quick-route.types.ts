import type { PlaceReference } from "@/lib/places";

import type { RoutePathOption } from "../hooks/useRouteDirections";
import type { RouteStyle } from "./route-style";

export type QuickRoutePlace = PlaceReference & {
  latitude: number;
  longitude: number;
};

export type QuickRouteDraft = {
  destination: QuickRoutePlace | null;
  origin: QuickRoutePlace | null;
  selectedBikeId: string | null;
  selectedOptionId: string | null;
  stops: QuickRoutePlace[];
};

export type QuickRoutePlannerSnapshot = {
  destination: QuickRoutePlace;
  origin: QuickRoutePlace;
  routeStyle?: RouteStyle;
  selectedOptionId: string | null;
  selectedRoute: RoutePathOption | null;
  stops: QuickRoutePlace[];
};
