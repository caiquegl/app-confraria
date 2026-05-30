import { api } from "@/lib/api";
import { saveToken } from "@/lib/auth";

import type { LoginFormData, LoginResponse } from "../types/login.types";

export async function loginUser(payload: LoginFormData): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/users/login", payload);
  await saveToken(data.token);
  return data;
}
