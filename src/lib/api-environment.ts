import AsyncStorage from "@react-native-async-storage/async-storage";

export type ApiEnvironment = "production" | "homolog";

export const API_ENVIRONMENTS: Record<ApiEnvironment, { label: string; url: string }> = {
  homolog: {
    label: "Homolog",
    url: "http://192.168.0.9:8080",
  },
  production: {
    label: "Produção",
    url: "https://confraria-backend.fly.dev",
  },
};

const API_ENVIRONMENT_KEY = "@confraria/api_environment";
const DEFAULT_ENVIRONMENT: ApiEnvironment = "production";

const listeners = new Set<(environment: ApiEnvironment) => void>();

function isApiEnvironment(value: string | null): value is ApiEnvironment {
  return value === "production" || value === "homolog";
}

export async function getApiEnvironment(): Promise<ApiEnvironment> {
  const stored = await AsyncStorage.getItem(API_ENVIRONMENT_KEY);
  return isApiEnvironment(stored) ? stored : DEFAULT_ENVIRONMENT;
}

export async function getApiBaseUrl(): Promise<string> {
  const environment = await getApiEnvironment();
  return API_ENVIRONMENTS[environment].url;
}

export async function setApiEnvironment(environment: ApiEnvironment): Promise<void> {
  await AsyncStorage.setItem(API_ENVIRONMENT_KEY, environment);
  listeners.forEach((listener) => listener(environment));
}

export async function toggleApiEnvironment(): Promise<ApiEnvironment> {
  const current = await getApiEnvironment();
  const next = current === "production" ? "homolog" : "production";
  await setApiEnvironment(next);
  return next;
}

export function subscribeApiEnvironment(
  listener: (environment: ApiEnvironment) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
