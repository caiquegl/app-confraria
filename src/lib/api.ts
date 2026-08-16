import { create } from "axios";

import { getApiBaseUrl } from "./api-environment";
import { getToken } from "./auth";
import { captureApiError, isTransientApiError } from "./sentry";

export const api = create({
  timeout: 60000,
});

function serializeRequestData(data: unknown): unknown {
  if (data == null) return null;

  if (typeof FormData !== "undefined" && data instanceof FormData) {
    return "[FormData]";
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data) as unknown;
    } catch {
      return data;
    }
  }

  return data;
}

api.interceptors.request.use(async (config) => {
  const baseURL = await getApiBaseUrl();
  config.baseURL = baseURL;

  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Evita POST/GET na raiz do host quando algum apiRoute vier undefined.
  const requestUrl = typeof config.url === "string" ? config.url.trim() : "";
  if (!requestUrl || requestUrl === "/") {
    const error = new Error(
      `Requisição API sem path válido (method=${config.method ?? "get"}). Verifique apiRoutes.`,
    );
    captureApiError(error, {
      method: config.method ?? "get",
      params: config.params ?? null,
      requestData: serializeRequestData(config.data),
      route: requestUrl || "(empty)",
      url: requestUrl || "(empty)",
    });
    return Promise.reject(error);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isCanceled =
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError" ||
      error?.name === "AbortError";

    if (isCanceled) {
      return Promise.reject(error);
    }

    const config = error.config;
    const response = error.response;
    const route =
      typeof config?.url === "string" && config.url.trim()
        ? config.url.trim()
        : "(unknown)";

    if (!isTransientApiError(error)) {
      captureApiError(error, {
        baseURL: config?.baseURL ?? null,
        method: (config?.method ?? "get").toUpperCase(),
        params: config?.params ?? null,
        requestData: serializeRequestData(config?.data),
        responseData: response?.data ?? null,
        route,
        status: response?.status ?? null,
        statusText: response?.statusText ?? null,
        url: route,
      });
    }

    return Promise.reject(error);
  },
);
