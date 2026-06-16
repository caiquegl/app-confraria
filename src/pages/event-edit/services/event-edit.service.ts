import { getApiBaseUrl } from "@/lib/api-environment";
import { apiRoutes } from "@/lib/api-routes";
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
  const formData = createEventUpdateFormData(payload);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendEventUpdateRequest({
    formData,
    token,
    url: `${baseURL}${apiRoutes.events.update(eventId)}`,
  });

  return JSON.parse(responseText) as EventDetail;
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
    mainText: place.mainText,
    placeId: place.placeId,
    reference: place.placeId,
    secondaryText: place.secondaryText ?? "",
    types: [],
  };
}

function formatIsoDateToBrazilian(iso: string) {
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
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
  return value.startsWith("http://") || value.startsWith("https://");
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

function parseErrorMessage(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join("\n");
    if (parsed.message) return parsed.message;
  } catch {
    // Keep generic message when backend response is not JSON.
  }

  return "Não foi possível atualizar o evento.";
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
