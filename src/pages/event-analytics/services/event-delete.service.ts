import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

export async function deleteEvent(eventId: string, reason?: string): Promise<void> {
  await api.delete(apiRoutes.events.delete(eventId), {
    data: reason ? { reason } : undefined,
  });
}
