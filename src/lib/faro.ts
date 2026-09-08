import Constants from "expo-constants";

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

let faroInstance: FaroApi | null = null;
let faroModule: FaroModule | null = null;
let initPromise: Promise<FaroApi | null> | null = null;

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

export async function initFaro(): Promise<FaroApi | null> {
  if (__DEV__) {
    return null;
  }

  const url =
    process.env.EXPO_PUBLIC_FARO_URL?.trim() ||
    "https://faro-collector-prod-sa-east-1.grafana.net/collect/2d7615b9a2fbd3092ed8ff1a2e294a09";
  if (!url) {
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

      const instance = await sdk.initializeFaro({
        app: {
          environment: "production",
          name: process.env.EXPO_PUBLIC_FARO_APP_NAME ?? "app-confraria",
          namespace: process.env.EXPO_PUBLIC_FARO_APP_NAMESPACE ?? "confraria",
          version:
            Constants.expoConfig?.version ??
            Constants.nativeAppVersion ??
            "1.0.0",
        },
        enableConsoleCapture: false,
        enableErrorReporting: true,
        sessionTracking: {
          enabled: true,
          persistent: false,
        },
        url,
      });

      faroInstance = instance as unknown as FaroApi;
      return faroInstance;
    } catch (error) {
      console.warn("[faro] Falha ao inicializar SDK; logs locais apenas.", error);
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
  void ensureFaro().then((instance) => {
    instance?.api.setUser(user);
  });
}

export function clearFaroUser(): void {
  void ensureFaro().then((instance) => {
    instance?.api.resetUser();
  });
}
