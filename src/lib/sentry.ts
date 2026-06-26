import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? "";

export const isSentryEnabled = SENTRY_DSN.length > 0;

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

export function initSentry(): void {
  if (!isSentryEnabled) {
    if (__DEV__) {
      console.warn("[sentry] EXPO_PUBLIC_SENTRY_DSN não configurado — monitoramento desativado.");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: false,
    environment: __DEV__ ? "development" : "production",
    release: `${Constants.expoConfig?.slug ?? "app-confraria"}@${Constants.expoConfig?.version ?? "0.0.0"}`,
    dist: Constants.expoConfig?.runtimeVersion?.toString(),
    integrations: [expoRouterTracingIntegration],
    enableNative: true,
    enableNativeCrashHandling: true,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
    attachStacktrace: true,
    beforeBreadcrumb(breadcrumb) {
      if (
        breadcrumb.category === "console" &&
        typeof breadcrumb.message === "string" &&
        breadcrumb.message.includes("[RouteTracking]")
      ) {
        return null;
      }

      return breadcrumb;
    },
    beforeSend(event) {
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
}

export function captureApiError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled) return;

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
  if (!isSentryEnabled) return;

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
  if (!isSentryEnabled) return;

  Sentry.addBreadcrumb({
    category: "app",
    data: data ? sanitizeContext(data) : undefined,
    level: "info",
    message,
  });
}

export { Sentry };
