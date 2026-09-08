import Constants from "expo-constants";

import {
  FARO_APP_NAME,
  FARO_APP_NAMESPACE,
  FARO_COLLECTOR_URL,
} from "./faro-config";
import { OTA_VERSION } from "./ota-version";

type FaroModule = typeof import("@grafana/faro-react-native");

type FaroApi = {
  api: {
    pushLog: (
      messages: string[],
      options?: { context?: Record<string, string>; level?: unknown },
    ) => void;
    resetUser: () => void;
    setUser: (user: { email?: string; id?: string }) => void;
  };
};

type FaroUser = { email?: string; id?: string };

let faroInstance: FaroApi | null = null;
let faroModule: FaroModule | null = null;
let initPromise: Promise<FaroApi | null> | null = null;
let faroUser: FaroUser | null = null;
let httpSessionId =
  Math.random().toString(36).slice(2, 10) +
  Math.random().toString(36).slice(2, 6);

export function getFaroLogLevel(
  level: "info" | "warn" | "error",
): unknown | undefined {
  const LogLevel = faroModule?.LogLevel;
  if (!LogLevel) {
    return undefined;
  }
  if (level === "error") return LogLevel.ERROR;
  if (level === "warn") return LogLevel.WARN;
  return LogLevel.INFO;
}

function resolveAppVersion(): string {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    `ota-${OTA_VERSION}`
  );
}

/** Reliable path: POST directly to the Faro collector (does not depend on SDK session). */
export async function sendFaroHttpLog(input: {
  level: "info" | "warn" | "error";
  message: string;
  context?: Record<string, string>;
}): Promise<void> {
  if (__DEV__) {
    return;
  }

  const body = {
    logs: [
      {
        context: input.context,
        level: input.level,
        message: input.message,
        timestamp: new Date().toISOString(),
      },
    ],
    meta: {
      app: {
        name: FARO_APP_NAME,
        namespace: FARO_APP_NAMESPACE,
        version: resolveAppVersion(),
      },
      sdk: {
        name: "confraria-app-http",
        version: String(OTA_VERSION),
      },
      session: { id: httpSessionId },
      ...(faroUser ? { user: faroUser } : {}),
    },
  };

  const response = await fetch(FARO_COLLECTOR_URL, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-faro-session-id": httpSessionId,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Faro HTTP ${response.status}`);
  }
}

export async function initFaro(): Promise<FaroApi | null> {
  if (__DEV__) {
    return null;
  }

  if (faroInstance) {
    return faroInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sdk = require("@grafana/faro-react-native") as FaroModule;
      faroModule = sdk;

      const SamplingRate = sdk.SamplingRate;
      const instance = await sdk.initializeFaro({
        app: {
          environment: "production",
          name: FARO_APP_NAME,
          namespace: FARO_APP_NAMESPACE,
          version: resolveAppVersion(),
        },
        enableConsoleCapture: false,
        enableErrorReporting: true,
        sessionTracking: {
          enabled: true,
          persistent: false,
          ...(SamplingRate ? { sampling: new SamplingRate(1) } : {}),
        },
        url: FARO_COLLECTOR_URL,
      });

      // Prefer returned instance; fall back to package singleton.
      faroInstance =
        (instance as unknown as FaroApi | undefined) ??
        (sdk.faro as unknown as FaroApi | undefined) ??
        null;

      if (faroUser && faroInstance) {
        faroInstance.api.setUser(faroUser);
      }

      return faroInstance;
    } catch (error) {
      console.warn("[faro] SDK init falhou; HTTP fallback ativo.", error);
      faroInstance = null;
      return null;
    }
  })();

  return initPromise;
}

export function getFaro(): FaroApi | null {
  return faroInstance;
}

export async function ensureFaro(): Promise<FaroApi | null> {
  if (faroInstance) {
    return faroInstance;
  }
  return initFaro();
}

export function setFaroUser(user: { email?: string; id: string }): void {
  faroUser = user;
  void ensureFaro().then((instance) => {
    instance?.api.setUser(user);
  });
}

export function clearFaroUser(): void {
  faroUser = null;
  void ensureFaro().then((instance) => {
    instance?.api.resetUser();
  });
}
