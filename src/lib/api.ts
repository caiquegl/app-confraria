import axios from "axios";

import { getToken } from "./auth";

export const api = axios.create({
  baseURL: "https://confraria-backend.onrender.com",
  //baseURL: "http://192.168.0.9:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
