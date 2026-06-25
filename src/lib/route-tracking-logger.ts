const PREFIX = "[RouteTracking]";

type LogPayload = Record<string, unknown> | string | undefined;

function formatPayload(payload: LogPayload): string {
  if (payload === undefined) return "";
  if (typeof payload === "string") return payload;

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }

  return { message: String(error) };
}

export const routeTrackingLog = {
  info(step: string, payload?: LogPayload) {
    if (payload === undefined) {
      console.log(`${PREFIX} ${step}`);
      return;
    }

    console.log(`${PREFIX} ${step}`, formatPayload(payload));
  },

  warn(step: string, payload?: LogPayload) {
    if (payload === undefined) {
      console.warn(`${PREFIX} ${step}`);
      return;
    }

    console.warn(`${PREFIX} ${step}`, formatPayload(payload));
  },

  error(step: string, error: unknown, payload?: LogPayload) {
    const { message, stack } = formatError(error);
    const extra = payload !== undefined ? formatPayload(payload) : "";

    console.error(`${PREFIX} ${step}`, message, extra, stack ?? "");
  },
};
