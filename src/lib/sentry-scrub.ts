const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "api-key",
  "api_key",
  "apikey",
  "auth",
  "authorization",
  "client_secret",
  "client_token",
  "key",
  "password",
  "secret",
  "signature",
  "token",
]);

const GOOGLE_API_KEY_PATTERN = /AIza[0-9A-Za-z_-]{20,}/g;
const SENSITIVE_QUERY_PATTERN =
  /([?&](?:access_token|api[_-]?key|auth|authorization|client_secret|client_token|key|password|secret|signature|token)=)([^&#]*)/gi;

type SentryBreadcrumbLike = {
  data?: Record<string, unknown>;
  message?: string;
};

type SentryRequestLike = {
  data?: unknown;
  headers?: Record<string, string>;
  query_string?: string | Record<string, string> | Array<[string, string]> | null;
  url?: string;
};

export type SentryEventLike = {
  breadcrumbs?: SentryBreadcrumbLike[];
  contexts?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  request?: SentryRequestLike;
};

export function scrubSensitiveText(value: string): string {
  let next = value.replace(GOOGLE_API_KEY_PATTERN, "[Redacted]");

  if (/^https?:\/\//i.test(next)) {
    try {
      const url = new URL(next);
      for (const param of [...url.searchParams.keys()]) {
        if (SENSITIVE_QUERY_KEYS.has(param.toLowerCase())) {
          url.searchParams.set(param, "[Redacted]");
        }
      }
      next = url.toString();
    } catch {
      // URL malformada — o regex abaixo ainda cobre `key=` na query.
    }
  }

  return next.replace(SENSITIVE_QUERY_PATTERN, "$1[Redacted]");
}

export function scrubSensitiveValue(value: unknown): unknown {
  if (typeof value === "string") {
    return scrubSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubSensitiveValue(item));
  }

  if (value && typeof value === "object") {
    const nested: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      nested[key] = scrubSensitiveValue(nestedValue);
    }
    return nested;
  }

  return value;
}

export function scrubSentryBreadcrumb<T extends SentryBreadcrumbLike>(
  breadcrumb: T,
): T {
  if (typeof breadcrumb.message === "string") {
    breadcrumb.message = scrubSensitiveText(breadcrumb.message);
  }

  if (breadcrumb.data) {
    breadcrumb.data = scrubSensitiveValue(breadcrumb.data) as Record<
      string,
      unknown
    >;
  }

  return breadcrumb;
}

export function scrubSentryEvent<T extends SentryEventLike>(event: T): T {
  if (event.request) {
    if (typeof event.request.url === "string") {
      event.request.url = scrubSensitiveText(event.request.url);
    }

    if (typeof event.request.query_string === "string") {
      event.request.query_string = scrubSensitiveText(
        `?${event.request.query_string}`,
      ).replace(/^\?/, "");
    } else if (event.request.query_string) {
      event.request.query_string = scrubSensitiveValue(
        event.request.query_string,
      ) as SentryRequestLike["query_string"];
    }

    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const key of Object.keys(headers)) {
        const normalized = key.toLowerCase();
        if (
          normalized === "authorization" ||
          normalized === "cookie" ||
          SENSITIVE_QUERY_KEYS.has(normalized)
        ) {
          headers[key] = "[Redacted]";
        }
      }
      event.request.headers = headers;
    }

    if (event.request.data !== undefined) {
      event.request.data = scrubSensitiveValue(event.request.data);
    }
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) =>
      scrubSentryBreadcrumb(breadcrumb),
    );
  }

  if (event.extra) {
    event.extra = scrubSensitiveValue(event.extra) as Record<string, unknown>;
  }

  if (event.contexts) {
    event.contexts = scrubSensitiveValue(event.contexts) as Record<
      string,
      unknown
    >;
  }

  return event;
}
