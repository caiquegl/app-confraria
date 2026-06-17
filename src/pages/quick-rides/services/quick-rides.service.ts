import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type { EventPlaceReference } from "@/pages/event-create/types/event-create.types";

import type {
  CreateQuickRidePayload,
  QuickRide,
  QuickRideDetail,
  QuickRideListItem,
} from "../types/quick-ride.types";

export function mapQuickRidePlaceToReference(place: {
  description: string;
  mainText: string;
  placeId: string;
  secondaryText: string | null;
}): EventPlaceReference {
  return {
    description: place.description,
    mainText: place.mainText,
    placeId: place.placeId,
    reference: place.description,
    secondaryText: place.secondaryText ?? "",
    types: [],
  };
}

export async function fetchActiveQuickRides(params: {
  city: string | null;
  region: string | null;
}): Promise<QuickRide[]> {
  if (!params.city?.trim()) {
    return [];
  }

  const region =
    params.region && params.region.trim().length <= 3 ? params.region.trim() : undefined;

  const { data } = await api.get<QuickRide[]>(
    apiRoutes.quickRides.list(params.city, region),
  );
  return data;
}

export async function fetchMyQuickRides(): Promise<QuickRideListItem[]> {
  const { data } = await api.get<QuickRideListItem[]>(apiRoutes.quickRides.mine);
  return data;
}

export async function fetchQuickRideDetail(quickRideId: string): Promise<QuickRideDetail> {
  const { data } = await api.get<QuickRideDetail>(apiRoutes.quickRides.detail(quickRideId));
  return data;
}

export async function joinQuickRide(quickRideId: string) {
  const { data } = await api.post(apiRoutes.quickRides.join(quickRideId));
  return data;
}

export async function leaveQuickRide(quickRideId: string) {
  const { data } = await api.delete(apiRoutes.quickRides.join(quickRideId));
  return data;
}

export async function createQuickRide(payload: CreateQuickRidePayload): Promise<QuickRide> {
  const { data } = await api.post<QuickRide>(apiRoutes.quickRides.create, payload);
  return data;
}

export async function updateQuickRide(
  quickRideId: string,
  payload: CreateQuickRidePayload,
): Promise<QuickRideDetail> {
  const { data } = await api.patch<QuickRideDetail>(
    apiRoutes.quickRides.update(quickRideId),
    payload,
  );
  return data;
}

export async function cancelQuickRide(quickRideId: string, reason?: string): Promise<void> {
  await api.delete(apiRoutes.quickRides.cancel(quickRideId), {
    data: reason ? { reason } : {},
  });
}

export type QuickRideDay = "today" | "tomorrow";

export function parseQuickRideSchedule(startsAt: string): {
  day: QuickRideDay;
  time: string;
} {
  const date = new Date(startsAt);
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const day: QuickRideDay = sameDay(date, tomorrow) ? "tomorrow" : "today";

  return { day, time: `${hour}:${minute}` };
}

export function buildQuickRideStartsAt(day: "today" | "tomorrow", time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  if (day === "tomorrow") {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(hour ?? 0, minute ?? 0, 0, 0);
  return date.toISOString();
}

export function isQuickRideTimePast(
  day: "today" | "tomorrow",
  time: string,
  now = new Date(),
): boolean {
  if (day === "tomorrow" || !/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  const [hour, minute] = time.split(":").map(Number);
  if ([hour, minute].some(Number.isNaN)) {
    return false;
  }

  const scheduled = new Date();
  scheduled.setHours(hour, minute, 0, 0);
  return scheduled.getTime() <= now.getTime();
}
