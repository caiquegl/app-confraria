import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

import {
  getApiEnvironment,
  subscribeApiEnvironment,
  type ApiEnvironment,
} from "./api-environment";
import { OTA_VERSION } from "./ota-version";
import {
  scrubSensitiveText,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
} from "./sentry-scrub";

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

export const isSentryEnabled = isSentryConfigured;

function createExpoRouterTracingIntegration() {
  try {
    if (typeof Sentry.expoRouterIntegration !== "function") {
      return undefined;
    }

    return Sentry.expoRouterIntegration({
      enableTimeToInitialDisplay: !__DEV__,
    });
  } catch {
    return undefined;
  }
}

export const expoRouterTracingIntegration = createExpoRouterTracingIntegration();

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

  if (typeof value === "string") {
    return truncateValue(scrubSensitiveText(value));
  }

  return truncateValue(value);
}

const TRANSIENT_API_STATUSES = new Set([429, 502, 503]);
const EXPECTED_CLIENT_STATUSES = new Set([400]);
const NETWORK_ERROR_CODES = new Set([
  "ERR_NETWORK",
  "ERR_INTERNET_DISCONNECTED",
  "ECONNABORTED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
]);
const NETWORK_ERROR_MESSAGES = [
  /network error/i,
  /network request failed/i,
  /failed to fetch/i,
  /fetch failed/i,
];

function resolveSentryEnvironment(): string {
  const channel = Updates.channel?.trim();
  if (channel === "preview" || channel === "production") {
    return channel;
  }
  return "production";
}

function getEventErrorMessage(event: Sentry.ErrorEvent): string {
  const exceptionValue = event.exception?.values?.[0]?.value;
  if (typeof exceptionValue === "string" && exceptionValue.trim()) {
    return exceptionValue;
  }

  if (typeof event.message === "string") {
    return event.message;
  }

  return "";
}

function isNetworkEventMessage(message: string): boolean {
  return NETWORK_ERROR_MESSAGES.some((pattern) => pattern.test(message));
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

  const sentryEnvironment = resolveSentryEnvironment();

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: false,
    environment: sentryEnvironment,
    release: `${Constants.expoConfig?.slug ?? "app-confraria"}@${Constants.expoConfig?.version ?? "0.0.0"}`,
    sendDefaultPii: false,
    integrations: expoRouterTracingIntegration
      ? [expoRouterTracingIntegration]
      : undefined,
    enableNative: true,
    enableNativeCrashHandling: true,
    enableNdk: true,
    enableTombstone: true,
    tracesSampleRate: 0.2,
    attachStacktrace: true,
    ignoreErrors: [
      "Network Error",
      "Network request failed",
      "Failed to fetch",
      /^Request failed with status code 400$/,
      /^Falha ao enviar localização em background \(40[034]\)$/,
    ],
    beforeBreadcrumb(breadcrumb) {
      return scrubSentryBreadcrumb(breadcrumb);
    },
    beforeSend(event) {
      if (!shouldSendToSentry()) {
        return null;
      }

      event.environment = event.environment?.trim() || sentryEnvironment;

      const errorMessage = getEventErrorMessage(event);
      if (isNetworkEventMessage(errorMessage)) {
        event.fingerprint = ["network-error"];
        return null;
      }

      if (!event.fingerprint?.length) {
        const exception = event.exception?.values?.[0];
        if (exception?.type === "AxiosError") {
          event.fingerprint = [
            "axios-error",
            exception.value?.trim() || "unknown",
          ];
        }
      }

      scrubSentryEvent(event);
      return event;
    },
  });

  Sentry.setTag("ota_channel", Updates.channel?.trim() || sentryEnvironment);
  Sentry.setTag("ota_version", String(OTA_VERSION));

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

export function getApiHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as { response?: { status?: number } }).response?.status;
  return typeof status === "number" ? status : null;
}

export function isNetworkApiError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const status = getApiHttpStatus(error);
  if (status === 0) return true;

  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && NETWORK_ERROR_CODES.has(code)) return true;

  const message = error instanceof Error ? error.message : String(error);
  return NETWORK_ERROR_MESSAGES.some((pattern) => pattern.test(message));
}

export function isTransientApiError(error: unknown): boolean {
  const status = getApiHttpStatus(error);
  return status != null && TRANSIENT_API_STATUSES.has(status);
}

/** Falhas esperadas: sem rede, 429/502/503, ou 400 de regra de negócio. */
export function isIgnorableApiError(error: unknown): boolean {
  if (isNetworkApiError(error)) return true;
  if (isTransientApiError(error)) return true;

  const status = getApiHttpStatus(error);
  return status != null && EXPECTED_CLIENT_STATUSES.has(status);
}

export function captureApiError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!shouldSendToSentry()) return;
  if (isIgnorableApiError(error)) return;

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

    scope.setFingerprint([
      "api-error",
      method ?? "unknown-method",
      route ?? "unknown-route",
      status ?? "unknown-status",
    ]);

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
  if (isIgnorableApiError(error)) return;

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
