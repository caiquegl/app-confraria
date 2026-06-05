import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-environment";
import { apiRoutes } from "@/lib/api-routes";
import { getToken } from "@/lib/auth";

import type { BikeBrand, SaveUserBikePayload, UserBike } from "../types/bikes.types";

export async function fetchBikeBrands(): Promise<BikeBrand[]> {
  const { data } = await api.get<BikeBrand[]>(apiRoutes.admin.bikeBrands);
  return data;
}

export async function fetchUserBikes(): Promise<UserBike[]> {
  const { data } = await api.get<UserBike[]>(apiRoutes.userBikes.list);
  return data;
}

export async function createUserBike(payload: SaveUserBikePayload): Promise<UserBike> {
  const formData = createBikeFormData(payload);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendBikeRequest({
    formData,
    method: "POST",
    token,
    url: `${baseURL}${apiRoutes.userBikes.list}`,
  });

  return JSON.parse(responseText) as UserBike;
}

export async function updateUserBike(
  bikeId: string,
  payload: SaveUserBikePayload,
): Promise<UserBike> {
  const formData = createBikeFormData(payload);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendBikeRequest({
    formData,
    method: "PATCH",
    token,
    url: `${baseURL}${apiRoutes.userBikes.detail(bikeId)}`,
  });

  return JSON.parse(responseText) as UserBike;
}

export async function deleteUserBike(bikeId: string): Promise<void> {
  await api.delete(apiRoutes.userBikes.detail(bikeId));
}

function createBikeFormData(payload: SaveUserBikePayload): FormData {
  const formData = new FormData();

  formData.append("brandId", payload.brandId);
  formData.append("model", payload.model.trim());
  formData.append("year", String(payload.year));
  formData.append("baseConsumption", String(payload.baseConsumption));
  formData.append("tankCapacity", String(payload.tankCapacity));
  formData.append("isMainBike", String(payload.isMainBike));
  formData.append("category", payload.category?.trim() ?? "");
  formData.append("color", payload.color?.trim() ?? "");
  formData.append("licensePlate", normalizePlate(payload.licensePlate ?? ""));
  formData.append("mileage", payload.mileage === null || payload.mileage === undefined ? "" : String(payload.mileage));

  if (payload.imageUri) {
    const extension = getFileExtension(payload.imageUri);
    const type = getMimeType(extension);

    formData.append("image", {
      name: `bike-${Date.now()}.${extension}`,
      type,
      uri: payload.imageUri,
    } as unknown as Blob);
  }

  return formData;
}

function sendBikeRequest(params: {
  formData: FormData;
  method: "POST" | "PATCH";
  token: string | null;
  url: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(params.method, params.url);
    xhr.timeout = 60000;
    xhr.setRequestHeader("Accept", "application/json");

    if (params.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${params.token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
        return;
      }

      reject(new Error(parseErrorMessage(xhr.responseText)));
    };

    xhr.onerror = () => reject(new Error("Falha de conexão ao salvar moto."));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado ao salvar moto."));
    xhr.send(params.formData);
  });
}

function parseErrorMessage(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join("\n");
    if (parsed.message) return parsed.message;
  } catch {
    // Keep generic message when the backend response is not JSON.
  }

  return "Não foi possível salvar a moto.";
}

function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

function getFileExtension(uri: string): string {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

function getMimeType(extension: string): string {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}
