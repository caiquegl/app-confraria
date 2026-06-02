import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { getApiBaseUrl, getApiEnvironment } from "@/lib/api-environment";
import { getToken } from "@/lib/auth";

import type {
  ComposeAudience,
  FeedComment,
  FeedCommentLikeResponse,
  FeedLikeResponse,
  FeedPost,
  FeedPostsPage,
} from "../types/feed.types";

export const FEED_PAGE_SIZE = 20;
export const FEED_PREFETCH_INDEX = 9;

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
  photos: string[];
}): Promise<FeedPost> {
  console.log("[feed.service] createFeedPost preparando FormData", {
    audience: params.audience,
    captionLength: params.caption.trim().length,
    photosCount: params.photos.length,
  });

  const formData = new FormData();

  formData.append("audience", params.audience);

  const caption = params.caption.trim();
  if (caption) {
    formData.append("caption", caption);
  }

  params.photos.forEach((uri, index) => {
    const extension = getFileExtension(uri);
    const type = getMimeType(extension);

    console.log("[feed.service] anexando foto", {
      extension,
      index,
      type,
      uri,
    });

    formData.append("files", {
      name: `feed-${Date.now()}-${index}.${extension}`,
      type,
      uri,
    } as unknown as Blob);
  });

  const environment = await getApiEnvironment();
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const url = `${baseURL}${apiRoutes.feed.posts}`;

  console.log("[feed.service] enviando POST /feed/posts via XHR", {
    environment,
    hasToken: Boolean(token),
    url,
  });

  const responseText = await sendFeedPostRequest({
    formData,
    token,
    url,
  });
  const data = JSON.parse(responseText) as FeedPost;

  console.log("[feed.service] POST /feed/posts sucesso", { postId: data.id });

  return data;
}

function sendFeedPostRequest(params: {
  formData: FormData;
  token: string | null;
  url: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", params.url);
    xhr.timeout = 60000;
    xhr.setRequestHeader("Accept", "application/json");

    if (params.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${params.token}`);
    }

    xhr.upload.onprogress = (event) => {
      console.log("[feed.service] upload progresso", {
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : undefined,
      });
    };

    xhr.onload = () => {
      console.log("[feed.service] XHR onload", {
        response: xhr.responseText?.slice(0, 300),
        status: xhr.status,
      });

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
        return;
      }

      reject(new Error(resolveApiErrorMessage(xhr.responseText, xhr.status)));
    };

    xhr.onerror = () => {
      console.log("[feed.service] XHR onerror", {
        response: xhr.responseText,
        status: xhr.status,
      });
      reject(new Error("Erro de rede ao enviar imagens. Verifique se o backend está acessível pelo celular."));
    };

    xhr.ontimeout = () => {
      console.log("[feed.service] XHR ontimeout");
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

function getFileExtension(uri: string): string {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (extension === "png" || extension === "webp" || extension === "jpg" || extension === "jpeg") {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

function getMimeType(extension: string): string {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
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
