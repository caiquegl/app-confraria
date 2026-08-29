import { routeTrackingLog } from "@/lib/route-tracking-logger";

export type RoutesAnalyticsEvent =
  | "routes_map_opened"
  | "quick_route_destination_searched"
  | "quick_route_calculated"
  | "route_profile_selected"
  | "quick_route_stop_added"
  | "quick_route_started"
  | "quick_route_saved"
  | "quick_route_converted_to_planner"
  | "community_route_personalized"
  | "navigation_minimized"
  | "navigation_resumed"
  | "navigation_recalculated"
  | "route_completed"
  | "fuel_estimate_viewed"
  | "garage_cta_clicked"
  | "free_route_limit_reached";

export function trackRoutesEvent(
  name: RoutesAnalyticsEvent,
  props?: Record<string, string | number | boolean | null | undefined>,
): void {
  routeTrackingLog.info(`routes-analytics:${name}`, props ?? {});
}
