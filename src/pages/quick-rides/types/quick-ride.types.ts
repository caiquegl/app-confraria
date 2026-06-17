import type { EventPlaceReference } from "@/pages/event-create/types/event-create.types";

export type QuickRidePlace = {
  description: string;
  latitude: number;
  longitude: number;
  mainText: string;
  placeId: string;
  role: string;
  secondaryText: string | null;
};

export type QuickRide = {
  confirmedParticipantIds: string[];
  description: string | null;
  destination: QuickRidePlace;
  host: {
    avatarUrl: string | null;
    id: string;
    name: string;
  };
  id: string;
  maxParticipants: number | null;
  origin: QuickRidePlace;
  participantCount: number;
  startsAt: string;
  title: string;
};

export type QuickRideParticipant = {
  avatarUrl: string | null;
  id: string;
  joinedAt: string;
  name: string;
};

export type QuickRideListItem = QuickRide & {
  isActive: boolean;
  isHost: boolean;
  isParticipant: boolean;
};

export type QuickRideDetail = QuickRideListItem & {
  participants: QuickRideParticipant[];
  remainingSpots: number | null;
};

export type CreateQuickRidePayload = {
  description: string;
  destination: EventPlaceReference;
  maxParticipants?: number;
  origin: EventPlaceReference;
  startsAt: string;
  title: string;
};

const GRACE_MS = 3 * 60 * 60 * 1000;

export function isQuickRideActive(ride: QuickRide, now: Date = new Date()): boolean {
  return new Date(ride.startsAt).getTime() + GRACE_MS >= now.getTime();
}

export function formatQuickRideWhen(startsAt: string, now: Date = new Date()): string {
  const date = new Date(startsAt);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeLabel = minute === 0 ? `${hour}h` : `${hour}h${String(minute).padStart(2, "0")}`;

  if (sameDay(date, now)) return `hoje ${timeLabel}`;
  if (sameDay(date, tomorrow)) return `amanhã ${timeLabel}`;

  const weekday = date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  return `${weekday} ${timeLabel}`;
}

export function isQuickRideFull(ride: QuickRide): boolean {
  return (
    ride.maxParticipants != null &&
    ride.confirmedParticipantIds.length >= ride.maxParticipants
  );
}

export function hasQuickRideStartTimePassed(ride: QuickRide, now: Date = new Date()): boolean {
  return new Date(ride.startsAt).getTime() <= now.getTime();
}

/** Carrossel da aba Eventos: só rolês futuros com vaga. */
export function isQuickRideDiscoverable(ride: QuickRide, now: Date = new Date()): boolean {
  return !hasQuickRideStartTimePassed(ride, now) && !isQuickRideFull(ride);
}

export function isQuickRideEnded(ride: QuickRide, now: Date = new Date()): boolean {
  return !isQuickRideActive(ride, now) || isQuickRideFull(ride);
}

export function isQuickRideListItemEnded(ride: QuickRideListItem): boolean {
  return !ride.isActive || isQuickRideFull(ride);
}

export function getQuickRideDestinationLabel(ride: QuickRide): string {
  const secondary = ride.destination.secondaryText?.trim();
  if (secondary) {
    return `${ride.destination.mainText}, ${secondary}`;
  }
  return ride.destination.mainText;
}

export function getQuickRideOriginDestinationLabel(ride: QuickRide): string {
  const origin = ride.origin.mainText.trim();
  const destination = getQuickRideDestinationLabel(ride);
  return `${origin} → ${destination}`;
}

export function isQuickRideFullFromDetail(ride: {
  isParticipant: boolean;
  maxParticipants: number | null;
  participantCount: number;
}): boolean {
  return (
    ride.maxParticipants != null &&
    ride.participantCount >= ride.maxParticipants &&
    !ride.isParticipant
  );
}
