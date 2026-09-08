import { appLog } from "./app-log";

type LogPayload = Record<string, unknown> | string | undefined;

function normalizePayload(payload?: LogPayload): Record<string, unknown> | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "string") return { detail: payload };
  return payload;
}

export const routeTrackingLog = {
  info(step: string, payload?: LogPayload) {
    appLog.info(`route-tracking:${step}`, normalizePayload(payload));
  },
  warn(step: string, payload?: LogPayload) {
    appLog.warn(`route-tracking:${step}`, normalizePayload(payload));
  },
  error(step: string, error: unknown, payload?: LogPayload) {
    appLog.error(`route-tracking:${step}`, {
      ...normalizePayload(payload),
      error: error instanceof Error ? error.message : String(error),
    });
  },
};
