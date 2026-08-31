import { isAxiosError } from "axios";

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
  latitude?: number;
  longitude?: number;
  mainText: string;
  placeId: string;
  secondaryText: string | null;
}): EventPlaceReference {
  return {
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    mainText: place.mainText,
    placeId: place.placeId,
    reference: place.description,
    secondaryText: place.secondaryText ?? "",
    types: [],
  };
}

export async function fetchActiveQuickRides(params: {
  city?: string | null;
  region?: string | null;
  state?: string | null;
}): Promise<QuickRide[]> {
  const state = params.state?.trim().toUpperCase();
  const city = params.city?.trim();

  if (!state && !city) {
    return [];
  }

  const region =
    params.region && params.region.trim().length <= 3
      ? params.region.trim()
      : undefined;

  const { data } = await api.get<QuickRide[]>(
    apiRoutes.quickRides.list({
      city: state ? undefined : city,
      region: state ? undefined : region,
      state,
    }),
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
  try {
    const { data } = await api.patch<QuickRideDetail>(
      apiRoutes.quickRides.update(quickRideId),
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(parseQuickRideError(error, "Não foi possível atualizar o rolê."));
  }
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
  const rideDay = formatDayInBrazil(date);
  const today = formatDayInBrazil(now);
  const tomorrow = formatDayInBrazil(addDays(now, 1));

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: BRAZIL_TIMEZONE,
  }).format(date);

  const day: QuickRideDay = rideDay === tomorrow ? "tomorrow" : "today";

  return { day, time };
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

export function resolveQuickRideStartsAt(
  day: QuickRideDay,
  time: string,
  originalStartsAt?: string,
): string {
  if (originalStartsAt) {
    const originalSchedule = parseQuickRideSchedule(originalStartsAt);
    if (originalSchedule.day === day && originalSchedule.time === time) {
      return originalStartsAt;
    }
  }

  return buildQuickRideStartsAt(day, time);
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

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

function formatDayInBrazil(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function parseQuickRideError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { message?: string | string[] } | undefined;
    const message = payload?.message;
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === "string").join(" ");
    }
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
