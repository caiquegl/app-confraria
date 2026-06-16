import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-environment";
import { apiRoutes } from "@/lib/api-routes";
import { getToken } from "@/lib/auth";
import { optimizeImageForUpload } from "@/lib/media-optimization";

import type {
  StoriesFeed,
  StoryDraftMedia,
  StoryGroup,
  StoryItem,
  StoryLikeResponse,
  StoryViewerUser,
} from "../types/stories.types";

type UploadProgressHandler = (progress: number) => void;

export async function fetchStoriesFeed(): Promise<StoriesFeed> {
  const { data } = await api.get<StoriesFeed>(apiRoutes.stories.feed);
  return data;
}

export async function createStory(
  media: StoryDraftMedia,
  onUploadProgress?: UploadProgressHandler,
): Promise<StoryItem> {
  const formData = new FormData();
  const uploadMedia =
    media.mediaType === "image"
      ? await optimizeImageForUpload(media.uri)
      : {
          extension: getFileExtension(media.uri, media.mediaType),
          mimeType: getMimeType(getFileExtension(media.uri, media.mediaType), media.mediaType),
          uri: media.uri,
        };

  formData.append("file", {
    name: `story-${Date.now()}.${uploadMedia.extension}`,
    type: uploadMedia.mimeType,
    uri: uploadMedia.uri,
  } as unknown as Blob);

  if (media.mediaType === "video" && media.durationMs) {
    formData.append("durationMs", String(media.durationMs));
  }

  if (media.overlays && media.overlays.length > 0) {
    formData.append("overlays", JSON.stringify(media.overlays));
  }

  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendStoryRequest({
    formData,
    onUploadProgress,
    token,
    url: `${baseURL}${apiRoutes.stories.create}`,
  });

  return JSON.parse(responseText) as StoryItem;
}

export async function fetchUserStories(userId: string): Promise<StoryGroup | null> {
  const { data } = await api.get<StoryGroup | null>(
    apiRoutes.stories.userStories(userId),
  );
  return data;
}

export async function markStoryViewed(storyId: string): Promise<void> {
  await api.post(apiRoutes.stories.markViewed(storyId));
}

export async function toggleStoryLike(storyId: string): Promise<StoryLikeResponse> {
  const { data } = await api.post<StoryLikeResponse>(apiRoutes.stories.like(storyId));
  return data;
}

export async function fetchStoryViewers(
  storyId: string,
): Promise<StoryViewerUser[]> {
  const { data } = await api.get<StoryViewerUser[]>(
    apiRoutes.stories.viewers(storyId),
  );
  return data;
}

export async function deleteStory(storyId: string): Promise<void> {
  await api.delete(apiRoutes.stories.delete(storyId));
}

function sendStoryRequest(params: {
  formData: FormData;
  onUploadProgress?: UploadProgressHandler;
  token: string | null;
  url: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", params.url);
    xhr.timeout = 120000;
    xhr.setRequestHeader("Accept", "application/json");

    if (params.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${params.token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !params.onUploadProgress) return;

      params.onUploadProgress(Math.min(event.loaded / event.total, 1));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        params.onUploadProgress?.(1);
        resolve(xhr.responseText);
        return;
      }

      reject(new Error(parseErrorMessage(xhr.responseText)));
    };

    xhr.onerror = () => reject(new Error("Falha de conexão ao enviar story."));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado ao enviar story."));
    xhr.send(params.formData);
  });
}

function parseErrorMessage(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join("\n");
    if (parsed.message) return parsed.message;
  } catch {
    // Keep the generic message below when backend response is not JSON.
  }

  return "Não foi possível enviar o story.";
}

function getFileExtension(uri: string, mediaType: StoryDraftMedia["mediaType"]): string {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (mediaType === "video") {
    if (extension && ["mp4", "mov", "m4v"].includes(extension)) {
      return extension;
    }

    return "mp4";
  }

  if (extension && ["jpg", "jpeg", "png", "webp", "heic"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

function getMimeType(extension: string, mediaType: StoryDraftMedia["mediaType"]): string {
  if (mediaType === "video") {
    if (extension === "mov") return "video/quicktime";
    if (extension === "m4v") return "video/x-m4v";
    return "video/mp4";
  }

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  return "image/jpeg";
}
