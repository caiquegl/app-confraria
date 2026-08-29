import type { CreateRoutePayload, UpdateRoutePayload } from "../types/saved-route.types";

export function isRemoteCoverUri(uri: string) {
  return /^https?:\/\//i.test(uri.trim());
}

function getFileExtension(uri: string) {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

function getMimeType(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

export function buildRouteCoverFormData(
  payload: CreateRoutePayload | UpdateRoutePayload,
  coverImageUri?: string | null,
) {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));

  if (coverImageUri && !isRemoteCoverUri(coverImageUri)) {
    const extension = getFileExtension(coverImageUri);
    formData.append("cover", {
      name: `route-cover-${Date.now()}.${extension}`,
      type: getMimeType(extension),
      uri: coverImageUri,
    } as unknown as Blob);
  }

  return formData;
}

export function parseRouteMutationError(responseText: string, fallback: string) {
  try {
    const parsed = JSON.parse(responseText) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join("\n");
    if (parsed.message) return parsed.message;
  } catch {
    // ignore
  }

  return fallback;
}
