import { create } from "axios";

import { getApiBaseUrl, getApiEnvironment } from "./api-environment";
import { getToken } from "./auth";

export const api = create({
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const environment = await getApiEnvironment();
  const baseURL = await getApiBaseUrl();
  config.baseURL = baseURL;

  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("[api] request", {
    baseURL,
    environment,
    hasToken: Boolean(token),
    method: config.method,
    url: config.url,
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("[api] response", {
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  (error) => {
    console.log("[api] response error", {
      baseURL: error?.config?.baseURL,
      code: error?.code,
      message: error?.message,
      method: error?.config?.method,
      status: error?.response?.status,
      url: error?.config?.url,
    });

    return Promise.reject(error);
  },
);
