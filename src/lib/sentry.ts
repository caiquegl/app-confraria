import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import {
  getApiEnvironment,
  subscribeApiEnvironment,
  type ApiEnvironment,
} from "./api-environment";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? "";

export const isSentryConfigured = SENTRY_DSN.length > 0;

/** Ambiente da API atual (produção/homolog). Hidratado após o boot. */
let apiEnvironment: ApiEnvironment = "production";

/**
 * Sentry só envia eventos em build de produção batendo na API de produção.
 * - `__DEV__` (Metro / desenvolvimento): desligado
 * - API homolog: desligado
 */
export function shouldSendToSentry(): boolean {
  if (__DEV__) return false;
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
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.includes("authorization") ||
      normalizedKey.includes("password") ||
      normalizedKey === "token" ||
      normalizedKey === "accesstoken" ||
      normalizedKey === "refreshtoken"
    ) {
      sanitized[key] = "[Redacted]";
      continue;
    }

    sanitized[key] = truncateValue(value);
  }

  return sanitized;
}

function applyApiEnvironmentToSentry(environment: ApiEnvironment) {
  apiEnvironment = environment;
  Sentry.setTag("api_environment", environment);
}

export function initSentry(): void {
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
    if (context) {
      scope.setContext("api", sanitizeContext(context));
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
