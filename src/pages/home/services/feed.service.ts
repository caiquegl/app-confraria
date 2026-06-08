import * as VideoThumbnails from "expo-video-thumbnails";

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { getApiBaseUrl } from "@/lib/api-environment";
import { getToken } from "@/lib/auth";
import { optimizeImageForUpload } from "@/lib/media-optimization";

import type {
  ComposeFeedMedia,
  ComposeAudience,
  FeedComment,
  FeedCommentLikeResponse,
  FeedLikeResponse,
  FeedPost,
  FeedPostsPage,
} from "../types/feed.types";

export const FEED_PAGE_SIZE = 20;
export const FEED_PREFETCH_INDEX = 9;

type UploadProgressHandler = (progress: number) => void;

export async function fetchFeedPosts(params?: {
  cursor?: string | null;
  limit?: number;
}): Promise<FeedPostsPage> {
  const { data } = await api.get<FeedPostsPage>(apiRoutes.feed.posts, {
    params: {
      cursor: params?.cursor ?? undefined,
      limit: params?.limit ?? FEED_PAGE_SIZE,
    },
  });

  return data;
}

export async function fetchFeedPost(postId: string): Promise<FeedPost> {
  const { data } = await api.get<FeedPost>(apiRoutes.feed.post(postId));
  return data;
}

export async function fetchLikedFeedPosts(params?: {
  cursor?: string | null;
  limit?: number;
}): Promise<FeedPostsPage> {
  const { data } = await api.get<FeedPostsPage>(apiRoutes.feed.likedPosts, {
    params: {
      cursor: params?.cursor ?? undefined,
      limit: params?.limit ?? FEED_PAGE_SIZE,
    },
  });

  return data;
}

export async function fetchUserFeedPosts(
  userId: string,
  params?: {
    cursor?: string | null;
    limit?: number;
  },
): Promise<FeedPostsPage> {
  const { data } = await api.get<FeedPostsPage>(apiRoutes.feed.userPosts(userId), {
    params: {
      cursor: params?.cursor ?? undefined,
      limit: params?.limit ?? FEED_PAGE_SIZE,
    },
  });

  return data;
}

export async function toggleFeedPostLike(postId: string): Promise<FeedLikeResponse> {
  const { data } = await api.post<FeedLikeResponse>(apiRoutes.feed.postLike(postId));
  return data;
}

export async function fetchFeedPostComments(postId: string): Promise<FeedComment[]> {
  const { data } = await api.get<FeedComment[]>(apiRoutes.feed.postComments(postId));
  return data;
}

export async function createFeedPostComment(
  postId: string,
  text: string,
  parentId?: string,
  replyToCommentId?: string,
): Promise<FeedComment> {
  const { data } = await api.post<FeedComment>(apiRoutes.feed.postComments(postId), {
    parentId,
    replyToCommentId,
    text,
  });
  return data;
}

export async function updateFeedPostComment(
  postId: string,
  commentId: string,
  text: string,
): Promise<FeedComment> {
  const { data } = await api.patch<FeedComment>(
    apiRoutes.feed.postComment(postId, commentId),
    { text },
  );
  return data;
}

export async function deleteFeedPostComment(
  postId: string,
  commentId: string,
): Promise<void> {
  await api.delete(apiRoutes.feed.postComment(postId, commentId));
}

export async function toggleFeedPostCommentLike(
  postId: string,
  commentId: string,
): Promise<FeedCommentLikeResponse> {
  const { data } = await api.post<FeedCommentLikeResponse>(
    apiRoutes.feed.postCommentLike(postId, commentId),
  );
  return data;
}

export async function createFeedPost(params: {
  audience: ComposeAudience;
  caption: string;
  media: ComposeFeedMedia[];
  onUploadProgress?: UploadProgressHandler;
}): Promise<FeedPost> {
  const formData = new FormData();

  formData.append("audience", params.audience);

  const caption = params.caption.trim();
  if (caption) {
    formData.append("caption", caption);
  }

  const uploadMedia = await Promise.all(
    params.media.map(async (media) => {
      if (media.mediaType === "image") {
        const optimizedImage = await optimizeImageForUpload(media.uri);
        return {
          ...media,
          extension: optimizedImage.extension,
          mimeType: optimizedImage.mimeType,
          uri: optimizedImage.uri,
        };
      }

      const thumbnailUri = media.thumbnailUri ?? await generateVideoThumbnail(media.uri);
      const extension = getFileExtension(media.uri, media.mediaType);
      return {
        ...media,
        extension,
        mimeType: getMimeType(extension, media.mediaType),
        thumbnailUri,
      };
    }),
  );

  uploadMedia.forEach((media, index) => {
    formData.append("files", {
      name: `feed-${Date.now()}-${index}.${media.extension}`,
      type: media.mimeType,
      uri: media.uri,
    } as unknown as Blob);
    formData.append(
      "durationMs",
      media.mediaType === "video" && media.durationMs ? String(media.durationMs) : "",
    );

    if (media.mediaType === "video" && media.thumbnailUri) {
      formData.append("thumbnailIndexes", String(index));
      formData.append("thumbnails", {
        name: `feed-video-thumb-${Date.now()}-${index}.jpg`,
        type: "image/jpeg",
        uri: media.thumbnailUri,
      } as unknown as Blob);
    }
  });

  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const url = `${baseURL}${apiRoutes.feed.posts}`;

  const responseText = await sendFeedPostRequest({
    formData,
    onUploadProgress: params.onUploadProgress,
    token,
    url,
  });
  const data = JSON.parse(responseText) as FeedPost;

  return data;
}

function sendFeedPostRequest(params: {
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

      reject(new Error(resolveApiErrorMessage(xhr.responseText, xhr.status)));
    };

    xhr.onerror = () => {
      reject(new Error("Erro de rede ao enviar imagens. Verifique se o backend está acessível pelo celular."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Tempo esgotado ao enviar o post."));
    };

    xhr.send(params.formData);
  });
}

function resolveApiErrorMessage(responseText: string, status: number): string {
  try {
    const parsed = JSON.parse(responseText) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join("\n");
    if (parsed.message) return parsed.message;
  } catch {
    // Usa mensagem padrão abaixo quando a API não retornar JSON.
  }

  return `Não foi possível publicar o post. Status ${status}`;
}

function getFileExtension(uri: string, mediaType: ComposeFeedMedia["mediaType"]): string {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (mediaType === "video") {
    if (extension && ["mp4", "mov", "m4v"].includes(extension)) {
      return extension;
    }

    return "mp4";
  }

  if (
    extension === "png" ||
    extension === "webp" ||
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "heic"
  ) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

function getMimeType(extension: string, mediaType: ComposeFeedMedia["mediaType"]): string {
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

async function generateVideoThumbnail(uri: string): Promise<string | null> {
  try {
    const thumbnail = await VideoThumbnails.getThumbnailAsync(uri, {
      quality: 0.72,
      time: 500,
    });

    return thumbnail.uri;
  } catch {
    return null;
  }
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `há ${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}
