import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type { EventAnalytics } from "../types/event-analytics.types";

export async function fetchEventAnalytics(eventId: string): Promise<EventAnalytics> {
  const { data } = await api.get<EventAnalytics>(apiRoutes.events.analytics(eventId));

  return data;
}
