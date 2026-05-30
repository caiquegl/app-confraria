import { api } from "@/lib/api";
import { saveToken } from "@/lib/auth";

import type {
  BikeCategory,
  RegisterPayload,
  RegisterResponse,
  RidingCompanion,
  Term,
  TripStyle,
} from "../types/wizard.types";

export async function checkEmailExists(email: string): Promise<boolean> {
  const { data } = await api.get<{ exists: boolean }>(
    `/users/check-email/${encodeURIComponent(email)}`,
  );
  return data.exists;
}

export async function fetchBikeCategories(): Promise<BikeCategory[]> {
  const { data } = await api.get<BikeCategory[]>("/admin/bike-categories");
  return data;
}

export async function fetchTripStyles(): Promise<TripStyle[]> {
  const { data } = await api.get<TripStyle[]>("/admin/trip-styles");
  return data;
}

export async function fetchRidingCompanions(): Promise<RidingCompanion[]> {
  const { data } = await api.get<RidingCompanion[]>("/admin/riding-companions");
  return data;
}

export async function fetchLatestTerm(): Promise<Term> {
  const { data } = await api.get<Term>("/admin/terms/latest");
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/users/register", {
    firstName: payload.firstName,
    email: payload.email,
    password: payload.password,
    hasLicense: payload.hasLicense,
    isAdult: payload.isAdult,
    bikeCategoryIds: payload.bikeCategoryIds,
    tripStyleId: payload.tripStyleId,
    ridingCompanionIds: payload.ridingCompanionIds,
  });

  await saveToken(data.token);
  return data;
}
