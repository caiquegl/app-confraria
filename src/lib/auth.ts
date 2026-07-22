import AsyncStorage from "@react-native-async-storage/async-storage";

import { getApiEnvironment } from "./api-environment";

const TOKEN_KEY_PREFIX = "@confraria/auth_token";

/**
 * O token é isolado por ambiente (production/homolog) para que trocar de
 * ambiente não reaproveite a sessão do outro — em homolog você cai no login,
 * e em produção sua sessão continua ativa.
 */
async function getTokenKey(): Promise<string> {
  const environment = await getApiEnvironment();
  return `${TOKEN_KEY_PREFIX}:${environment}`;
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(await getTokenKey(), token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(await getTokenKey());
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(await getTokenKey());
}

export async function getCurrentUserId(): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      sub?: string;
    };

    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
