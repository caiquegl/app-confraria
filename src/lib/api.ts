import { create } from "axios";

import { getApiBaseUrl } from "./api-environment";
import { getToken } from "./auth";
import { captureApiError } from "./sentry";

export const api = create({
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const baseURL = await getApiBaseUrl();
  config.baseURL = baseURL;

  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

    captureApiError(error, {
      baseURL: config?.baseURL,
      method: config?.method,
      requestData: config?.data,
      responseData: response?.data,
      status: response?.status,
      statusText: response?.statusText,
      url: config?.url,
    });

    return Promise.reject(error);
  },
);
