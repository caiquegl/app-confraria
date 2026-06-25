import { registerRouteLocationTask } from "@/lib/route-background-tracking";
import { routeTrackingLog } from "@/lib/route-tracking-logger";

routeTrackingLog.info("route-location-tracking.task:module-loaded");
registerRouteLocationTask();
