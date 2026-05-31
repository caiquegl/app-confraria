import axios from "axios";

import { getApiBaseUrl } from "./api-environment";
import { getToken } from "./auth";

export const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  config.baseURL = await getApiBaseUrl();

  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
