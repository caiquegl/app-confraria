import type { EventDraft } from "../types/event-create.types";

export const EVENT_CREATE_TOTAL_STEPS = 4;

export const EVENT_CATEGORIES = [
  "Moto Club",
  "Estrada",
  "Off-road",
  "Encontro",
  "Passeio",
  "Beneficente",
];

export function createInitialEventDraft(): EventDraft {
  return {
    category: "",
    date: "",
    description: "",
    destination: "",
    endTime: "",
    gallery: [],
    hasParticipantLimit: false,
    image: "",
    included: [],
    location: "",
    maxParticipants: undefined,
    requirements: [],
    startTime: "",
    stops: [],
    title: "",
  };
}

export function formatEventWeekday(dateValue: string) {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

export function formatEventDuration(startTime: string, endTime: string) {
  if (!startTime || !endTime) return "";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return "";

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const duration = endTotal - startTotal;

  if (duration <= 0) return "";

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours && minutes) return `${hours}h${String(minutes).padStart(2, "0")} de duração`;
  if (hours) return `${hours}h de duração`;
  return `${minutes}min de duração`;
}
