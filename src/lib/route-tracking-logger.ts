type LogPayload = Record<string, unknown> | string | undefined;

export const routeTrackingLog = {
  info(_step: string, _payload?: LogPayload) {},
  warn(_step: string, _payload?: LogPayload) {},
  error(_step: string, _error: unknown, _payload?: LogPayload) {},
};
