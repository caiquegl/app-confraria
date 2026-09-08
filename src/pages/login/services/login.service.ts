import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";
import { appLog } from "@/lib/app-log";
import { getCurrentUserId, saveToken } from "@/lib/auth";
import { setFaroUser } from "@/lib/faro";

import type { LoginFormData, LoginResponse } from "../types/login.types";

export async function loginUser(payload: LoginFormData): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>(apiRoutes.users.login, payload);
    await saveToken(data.token);

    const userId = await getCurrentUserId();
    if (userId) {
      setFaroUser({ email: payload.email, id: userId });
    }
    appLog.info("login success", { userId: userId ?? undefined });

    return data;
  } catch (error) {
    appLog.warn("login failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
