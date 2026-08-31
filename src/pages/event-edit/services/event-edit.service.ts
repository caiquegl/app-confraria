import { isAxiosError } from "axios";

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { getApiBaseUrl } from "@/lib/api-environment";
import { getToken } from "@/lib/auth";
import type {
  EventCreatePayload,
  EventDraft,
  EventPlaceReference,
} from "@/pages/event-create/types/event-create.types";
import type { EventDetail, EventDetailPlace } from "@/pages/event-detail/types/event-detail.types";

export async function updateEvent(
  eventId: string,
  payload: EventCreatePayload,
): Promise<EventDetail> {
  if (!hasLocalImageFiles(payload)) {
    try {
      const { data } = await api.patch<EventDetail>(apiRoutes.events.update(eventId), {
        payload: JSON.stringify(payload),
      });
      return data;
    } catch (error) {
      throw new Error(parseRequestError(error, "Não foi possível atualizar o evento."));
    }
  }

  const formData = createEventUpdateFormData(payload);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendEventUpdateRequest({
    formData,
    token,
    url: `${baseURL}${apiRoutes.events.update(eventId)}`,
  });

  return parseEventUpdateResponse(responseText);
}

export function mapEventDetailToDraft(event: EventDetail): EventDraft {
  const origin = event.places.find((place) => place.role === "origin") ?? null;
  const destination =
    event.places.find((place) => place.role === "destination") ?? null;
  const stops = event.places.filter((place) => place.role === "stop");

  return {
    category: event.category,
    date: formatIsoDateToBrazilian(event.date),
    description: event.description ?? "",
    destination: destination ? mapPlaceToReference(destination) : null,
    endTime: event.endTime ?? "",
    gallery: event.galleryImageUrls,
    hasParticipantLimit: event.participantLimit !== null,
    image: event.coverImageUrl ?? "",
    included: event.included,
    location: origin ? mapPlaceToReference(origin) : null,
    maxParticipants: event.participantLimit ?? undefined,
    requirements: event.requirements,
    startTime: event.startTime ?? "",
    stops: stops.map((stop) => mapPlaceToReference(stop)),
    title: event.title,
  };
}

function mapPlaceToReference(place: EventDetailPlace): EventPlaceReference {
  return {
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    mainText: place.mainText,
    placeId: place.placeId,
    reference: place.placeId,
    secondaryText: place.secondaryText ?? "",
    types: [],
  };
}

function formatIsoDateToBrazilian(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(date);
}

function hasLocalImageFiles(payload: EventCreatePayload) {
  const hasLocalCover = Boolean(
    payload.coverImageUri && !isRemoteUri(payload.coverImageUri),
  );
  const hasLocalGallery = payload.galleryUris.some((uri) => !isRemoteUri(uri));
  return hasLocalCover || hasLocalGallery;
}

function createEventUpdateFormData(payload: EventCreatePayload) {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));

  if (payload.coverImageUri && !isRemoteUri(payload.coverImageUri)) {
    const extension = getFileExtension(payload.coverImageUri);
    formData.append("cover", {
      name: `event-cover-${Date.now()}.${extension}`,
      type: getMimeType(extension),
      uri: payload.coverImageUri,
    } as unknown as Blob);
  }

  payload.galleryUris.forEach((uri, index) => {
    if (isRemoteUri(uri)) return;

    const extension = getFileExtension(uri);
    formData.append("gallery", {
      name: `event-gallery-${Date.now()}-${index}.${extension}`,
      type: getMimeType(extension),
      uri,
    } as unknown as Blob);
  });

  return formData;
}

function isRemoteUri(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function sendEventUpdateRequest(params: {
  formData: FormData;
  token: string | null;
  url: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PATCH", params.url);
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

    xhr.onerror = () => reject(new Error("Falha de conexão ao atualizar evento."));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado ao atualizar evento."));
    xhr.send(params.formData);
  });
}

function parseEventUpdateResponse(responseText: string): EventDetail {
  if (!responseText.trim()) {
    throw new Error("Não foi possível atualizar o evento.");
  }

  try {
    return JSON.parse(responseText) as EventDetail;
  } catch {
    throw new Error("Não foi possível atualizar o evento.");
  }
}

function parseRequestError(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return parseErrorMessage(
      typeof error.response?.data === "string"
        ? error.response.data
        : JSON.stringify(error.response?.data ?? {}),
      fallback,
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function parseErrorMessage(responseText: string, fallback = "Não foi possível atualizar o evento."): string {
  try {
    const parsed = JSON.parse(responseText) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) {
      return parsed.message.filter((item) => typeof item === "string").join(" ");
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Keep generic message when backend response is not JSON.
  }

  return fallback;
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
