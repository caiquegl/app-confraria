import { ensureFaro, getFaroLogLevel } from "./faro";

type Attrs = Record<string, unknown>;

function toContext(attrs?: Attrs): Record<string, string> | undefined {
  if (!attrs) {
    return undefined;
  }

  const context: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    context[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return Object.keys(context).length > 0 ? context : undefined;
}

function push(
  level: "info" | "warn" | "error",
  message: string,
  attrs?: Attrs,
) {
  const prefix = `[app] ${message}`;
  if (attrs) {
    console[level](prefix, attrs);
  } else {
    console[level](prefix);
  }

  if (__DEV__) {
    return;
  }

  void ensureFaro()
    .then((instance) => {
      if (!instance) return;
      const faroLevel = getFaroLogLevel(level);
      instance.api.pushLog([message], {
        context: toContext(attrs),
        ...(faroLevel != null ? { level: faroLevel } : {}),
      });
    })
    .catch(() => {
      // Telemetry must never break user flows.
    });
}

export const appLog = {
  info(message: string, attrs?: Attrs) {
    push("info", message, attrs);
  },
  warn(message: string, attrs?: Attrs) {
    push("warn", message, attrs);
  },
  error(message: string, attrs?: Attrs) {
    push("error", message, attrs);
  },
};
