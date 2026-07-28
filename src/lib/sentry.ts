import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  getApiEnvironment,
  subscribeApiEnvironment,
  type ApiEnvironment,
} from "./api-environment";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? "";

export const isSentryConfigured = SENTRY_DSN.length > 0;

/** Ambiente da API atual (produção/homolog). Hidratado após o boot. */
let apiEnvironment: ApiEnvironment = "production";

/** SSR do Expo Router (Node) não tem `window` — AsyncStorage/Sentry quebram. */
function isServerSideRender(): boolean {
  return Platform.OS === "web" && typeof window === "undefined";
}

/**
 * Sentry só envia eventos em build de produção batendo na API de produção.
 * - `__DEV__` (Metro / desenvolvimento): desligado
 * - API homolog: desligado
 */
export function shouldSendToSentry(): boolean {
  if (__DEV__) return false;
  if (isServerSideRender()) return false;
  if (!isSentryConfigured) return false;
  if (apiEnvironment === "homolog") return false;
  return true;
}

/** @deprecated use isSentryConfigured / shouldSendToSentry */
export const isSentryEnabled = isSentryConfigured;

export const expoRouterTracingIntegration = Sentry.expoRouterIntegration({
  enableTimeToInitialDisplay: !__DEV__,
});

function truncateValue(value: unknown, maxLength = 2_000): unknown {
  if (value == null) return value;

  if (typeof value === "string") {
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized.length <= maxLength) return value;
    return `${serialized.slice(0, maxLength)}…`;
  } catch {
    return String(value);
  }
}

function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = sanitizeValue(key, value);
  }

  return sanitized;
}

function sanitizeValue(key: string, value: unknown): unknown {
  const normalizedKey = key.toLowerCase();

  if (
    normalizedKey.includes("authorization") ||
    normalizedKey.includes("password") ||
    normalizedKey.includes("secret") ||
    normalizedKey === "token" ||
    normalizedKey === "accesstoken" ||
    normalizedKey === "refreshtoken" ||
    normalizedKey === "apikey" ||
    normalizedKey === "api_key"
  ) {
    return "[Redacted]";
  }

  if (value == null) return value;

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeValue(String(index), item));
  }

  if (typeof value === "object") {
    const nested: Record<string, unknown> = {};
    for (const [nestedKey, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      nested[nestedKey] = sanitizeValue(nestedKey, nestedValue);
    }
    return truncateValue(nested);
  }

  return truncateValue(value);
}

function applyApiEnvironmentToSentry(environment: ApiEnvironment) {
  apiEnvironment = environment;
  Sentry.setTag("api_environment", environment);
}

export function initSentry(): void {
  if (isServerSideRender()) {
    return;
  }

  if (!isSentryConfigured) {
    if (__DEV__) {
      console.warn(
        "[sentry] EXPO_PUBLIC_SENTRY_DSN não configurado — monitoramento desativado.",
      );
    }
    return;
  }

  if (__DEV__) {
    console.warn("[sentry] Desativado em desenvolvimento (__DEV__).");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: false,
    environment: "production",
    release: `${Constants.expoConfig?.slug ?? "app-confraria"}@${Constants.expoConfig?.version ?? "0.0.0"}`,
    integrations: [expoRouterTracingIntegration],
    enableNative: true,
    enableNativeCrashHandling: true,
    enableNdk: true,
    enableTombstone: true,
    tracesSampleRate: 0.2,
    attachStacktrace: true,
    beforeSend(event) {
      if (!shouldSendToSentry()) {
        return null;
      }

      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        for (const key of Object.keys(headers)) {
          if (key.toLowerCase() === "authorization") {
            headers[key] = "[Redacted]";
          }
        }
        event.request.headers = headers;
      }

      return event;
    },
  });

  void getApiEnvironment().then((environment) => {
    applyApiEnvironmentToSentry(environment);
    if (environment === "homolog") {
      console.warn("[sentry] Desativado enquanto a API estiver em homolog.");
    }
  });

  subscribeApiEnvironment((environment) => {
    applyApiEnvironmentToSentry(environment);
    if (environment === "homolog") {
      console.warn("[sentry] Desativado: ambiente da API = homolog.");
    }
  });
}

export function captureApiError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!shouldSendToSentry()) return;

  Sentry.withScope((scope) => {
    scope.setTag("feature", "api");

    const method =
      typeof context?.method === "string" ? context.method.toUpperCase() : null;
    const route = typeof context?.route === "string" ? context.route : null;
    const status =
      typeof context?.status === "number" ? String(context.status) : null;

    if (method) scope.setTag("http.method", method);
    if (route) scope.setTag("http.route", route);
    if (status) scope.setTag("http.status_code", status);

    // Agrupa erros por método + rota no Sentry.
    if (method && route) {
      scope.setFingerprint(["api-error", method, route, status ?? "network"]);
    }

    if (context) {
      scope.setContext("api", sanitizeContext(context));
      scope.setExtra("api_route", route);
      scope.setExtra("api_params", sanitizeValue("params", context.params));
      scope.setExtra(
        "api_request_data",
        sanitizeValue("requestData", context.requestData),
      );
    }

    Sentry.captureException(error);
  });
}

export function captureRouteError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!shouldSendToSentry()) return;

  Sentry.withScope((scope) => {
    scope.setTag("feature", "routes");
    if (context?.routeId) {
      scope.setTag("routeId", String(context.routeId));
    }
    if (context?.screen) {
      scope.setTag("screen", String(context.screen));
    }
    if (context) {
      scope.setContext("route", sanitizeContext(context));
    }
    Sentry.captureException(error);
  });
}

export function addSentryBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!shouldSendToSentry()) return;

  Sentry.addBreadcrumb({
    category: "app",
    data: data ? sanitizeContext(data) : undefined,
    level: "info",
    message,
  });
}

export { Sentry };
