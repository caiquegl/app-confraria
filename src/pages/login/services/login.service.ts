import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { saveToken } from "@/lib/auth";

import type { LoginFormData, LoginResponse } from "../types/login.types";

export async function loginUser(payload: LoginFormData): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(apiRoutes.users.login, payload);
  await saveToken(data.token);
  return data;
}
