import { getApiBaseUrl } from "@/lib/api-environment";
import { apiRoutes } from "@/lib/api-routes";
import { getToken } from "@/lib/auth";

import type {
  CreateRoutePayload,
  RouteApiResponse,
  UpdateRoutePayload,
} from "../types/saved-route.types";
import {
  buildRouteCoverFormData,
  parseRouteMutationError,
} from "../utils/route-cover.utils";

async function sendRouteMutationRequest(params: {
  formData: FormData;
  method: "PATCH" | "POST";
  token: string | null;
  url: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(params.method, params.url);
    xhr.timeout = 120000;
    xhr.setRequestHeader("Accept", "application/json");

    if (params.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${params.token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
        return;
      }

      reject(new Error(parseRouteMutationError(xhr.responseText, "Não foi possível salvar a rota.")));
    };

    xhr.onerror = () => reject(new Error("Falha de rede ao salvar a rota."));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado ao salvar a rota."));
    xhr.send(params.formData);
  });
}

export async function createRoute(
  payload: CreateRoutePayload,
  coverImageUri?: string | null,
): Promise<RouteApiResponse> {
  const formData = buildRouteCoverFormData(payload, coverImageUri);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendRouteMutationRequest({
    formData,
    method: "POST",
    token,
    url: `${baseURL}${apiRoutes.routes.create}`,
  });

  return JSON.parse(responseText) as RouteApiResponse;
}

export async function updateRoute(
  routeId: string,
  payload: UpdateRoutePayload,
  coverImageUri?: string | null,
): Promise<RouteApiResponse> {
  const formData = buildRouteCoverFormData(payload, coverImageUri);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendRouteMutationRequest({
    formData,
    method: "PATCH",
    token,
    url: `${baseURL}${apiRoutes.routes.update(routeId)}`,
  });

  return JSON.parse(responseText) as RouteApiResponse;
}

export async function copyPublishedRoute(
  routeId: string,
  payload: CreateRoutePayload,
  coverImageUri?: string | null,
): Promise<RouteApiResponse> {
  const formData = buildRouteCoverFormData(payload, coverImageUri);
  const baseURL = await getApiBaseUrl();
  const token = await getToken();
  const responseText = await sendRouteMutationRequest({
    formData,
    method: "POST",
    token,
    url: `${baseURL}${apiRoutes.routes.copy(routeId)}`,
  });

  return JSON.parse(responseText) as RouteApiResponse;
}
