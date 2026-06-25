import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-environment";
import { apiRoutes } from "@/lib/api-routes";
import { getToken } from "@/lib/auth";
import { fetchPlaceAutocomplete } from "@/lib/places";

import type {
  EventCategory,
  EventCreatePayload,
  EventCreateResponse,
  EventDraft,
  EventPlaceReference,
} from "../types/event-create.types";

export const EVENT_CREATE_TOTAL_STEPS = 4;

export async function fetchEventCategories(): Promise<EventCategory[]> {
  const { data } = await api.get<EventCategory[]>(apiRoutes.admin.eventCategories);
  return data;
}

export { fetchPlaceAutocomplete };

export async function createEvent(payload: EventCreatePayload): Promise<EventCreateResponse> {
  const formData = createEventFormData(payload);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendEventRequest({
    formData,
    token,
    url: `${baseURL}${apiRoutes.events.create}`,
  });

  return JSON.parse(responseText) as EventCreateResponse;
}

function createEventFormData(payload: EventCreatePayload) {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));

  if (payload.coverImageUri) {
    const extension = getFileExtension(payload.coverImageUri);
    formData.append("cover", {
      name: `event-cover-${Date.now()}.${extension}`,
      type: getMimeType(extension),
      uri: payload.coverImageUri,
    } as unknown as Blob);
  }

  payload.galleryUris.slice(0, 10).forEach((uri, index) => {
    const extension = getFileExtension(uri);
    formData.append("gallery", {
      name: `event-gallery-${Date.now()}-${index}.${extension}`,
      type: getMimeType(extension),
      uri,
    } as unknown as Blob);
  });

  return formData;
}

export function formatBrazilianDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

export function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  const hour = digits.slice(0, 2);
  const minute = digits.slice(2, 4);

  if (digits.length <= 2) return hour;
  return `${hour}:${minute}`;
}

export function createInitialEventDraft(): EventDraft {
  return {
    category: "",
    date: "",
    description: "",
    destination: null,
    endTime: "",
    gallery: [],
    hasParticipantLimit: false,
    image: "",
    included: [],
    location: null,
    maxParticipants: undefined,
    requirements: [],
    startTime: "",
    stops: [],
    title: "",
  };
}

export function formatEventWeekday(dateValue: string) {
  const date = parseBrazilianDate(dateValue);
  if (!date) return "";

  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

export function formatEventDuration(startTime: string, endTime: string) {
  if (!isValidTime(startTime) || !isValidTime(endTime)) return "";

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

export function isValidBrazilianDate(value: string) {
  return parseBrazilianDate(value) !== null;
}

export function isPastBrazilianDate(value: string) {
  const date = parseBrazilianDate(value);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

export function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;

  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function parseBrazilianDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day, 12);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function sendEventRequest(params: {
  formData: FormData;
  token: string | null;
  url: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", params.url);
    xhr.timeout = 90000;
    xhr.setRequestHeader("Accept", "application/json");

    if (params.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${params.token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
        return;
      }

      reject(new Error(parseErrorMessage(xhr.responseText)));
    };

    xhr.onerror = () => reject(new Error("Falha de conexão ao criar evento."));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado ao criar evento."));
    xhr.send(params.formData);
  });
}

function parseErrorMessage(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join("\n");
    if (parsed.message) return parsed.message;
  } catch {
    // Keep generic message when backend response is not JSON.
  }

  return "Não foi possível criar o evento.";
}

function getFileExtension(uri: string): string {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

function getMimeType(extension: string): string {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}
