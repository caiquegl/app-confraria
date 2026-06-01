import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
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
  const { data } = await api.get<{ exists: boolean }>(apiRoutes.users.checkEmail(email));
  return data.exists;
}

export async function fetchBikeCategories(): Promise<BikeCategory[]> {
  const { data } = await api.get<BikeCategory[]>(apiRoutes.admin.bikeCategories);
  return data;
}

export async function fetchTripStyles(): Promise<TripStyle[]> {
  const { data } = await api.get<TripStyle[]>(apiRoutes.admin.tripStyles);
  return data;
}

export async function fetchRidingCompanions(): Promise<RidingCompanion[]> {
  const { data } = await api.get<RidingCompanion[]>(apiRoutes.admin.ridingCompanions);
  return data;
}

export async function fetchLatestTerm(): Promise<Term> {
  const { data } = await api.get<Term>(apiRoutes.admin.termsLatest);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>(apiRoutes.users.register, {
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
