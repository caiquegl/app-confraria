import { create } from "axios";

import { getApiBaseUrl } from "./api-environment";
import { getToken } from "./auth";

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
  (response) => {

    return response;
  },
  (error) => {

    return Promise.reject(error);
  },
);
