import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import type { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import type { TaskManagerTaskBody } from "expo-task-manager";
import { Platform } from "react-native";

import { API_ENVIRONMENTS, type ApiEnvironment } from "./api-environment";
import { routeTrackingLog } from "./route-tracking-logger";
import { captureRouteError } from "./sentry";

const TOKEN_KEY = "@confraria/auth_token";
const API_ENVIRONMENT_KEY = "@confraria/api_environment";
export const ROUTE_BACKGROUND_TRACKING_KEY = "@confraria/route_background_tracking";
export const ROUTE_LOCATION_TASK_NAME = "route-location-tracking";
const PENDING_LOCATION_KEY = "@confraria/route_background_pending_location";

const NETWORK_ERROR_PATTERNS = [
  /network request failed/i,
  /network error/i,
  /failed to fetch/i,
  /fetch failed/i,
  /unknownhostexception/i,
  /unable to resolve host/i,
  /no address associated with hostname/i,
  /timed?\s*out/i,
  /econnaborted/i,
  /econnreset/i,
  /enotfound/i,
  /socket hang up/i,
];

export type RouteBackgroundTrackingSession = {
  routeId: string;
  routeTitle: string;
};

type PendingRouteLocation = {
  heading: number;
  latitude: number;
  longitude: number;
  routeId: string;
  updatedAt: string;
};

function isApiEnvironment(value: string | null): value is ApiEnvironment {
  return value === "production" || value === "homolog";
}

async function getTrackingDiagnostics() {
  const [taskDefined, taskRegistered, isRunning, session] = await Promise.all([
    Promise.resolve(TaskManager.isTaskDefined(ROUTE_LOCATION_TASK_NAME)),
    isLocationTaskRegistered(),
    hasLocationUpdatesStarted(),
    readTrackingSession(),
  ]);

  return {
    isRunning,
    platform: Platform.OS,
    session,
    taskDefined,
    taskRegistered,
  };
}

function isBenignLocationTaskError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("TaskNotFoundException") ||
    message.includes("E_TASK_NOT_FOUND") ||
    /task.*not found/i.test(message)
  );
}

async function hasLocationUpdatesStarted(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(ROUTE_LOCATION_TASK_NAME);
  } catch (error) {
    if (isBenignLocationTaskError(error)) {
      routeTrackingLog.info("hasLocationUpdatesStarted:task-not-found");
      return false;
    }

    throw error;
  }
}

async function getApiBaseUrlForTask(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_ENVIRONMENT_KEY);
  const environment = isApiEnvironment(stored) ? stored : "production";
  return API_ENVIRONMENTS[environment].url;
}

async function isLocationTaskRegistered(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(ROUTE_LOCATION_TASK_NAME);
  } catch (error) {
    routeTrackingLog.error("isLocationTaskRegistered:failed", error);
    return false;
  }
}

async function safeStopLocationUpdates(): Promise<void> {
  try {
    if (!TaskManager.isTaskDefined(ROUTE_LOCATION_TASK_NAME)) {
      routeTrackingLog.info("safeStopLocationUpdates:skip", { reason: "task-not-defined" });
      return;
    }

    const isRegistered = await isLocationTaskRegistered();
    if (!isRegistered) {
      routeTrackingLog.info("safeStopLocationUpdates:skip", { reason: "task-not-registered" });
      return;
    }

    const isRunning = await hasLocationUpdatesStarted();
    if (!isRunning) {
      routeTrackingLog.info("safeStopLocationUpdates:skip", { reason: "not-running" });
      return;
    }

    routeTrackingLog.info("safeStopLocationUpdates:stopping");
    await Location.stopLocationUpdatesAsync(ROUTE_LOCATION_TASK_NAME);
    routeTrackingLog.info("safeStopLocationUpdates:stopped");
  } catch (error) {
    if (isBenignLocationTaskError(error)) {
      routeTrackingLog.info("safeStopLocationUpdates:skip", { reason: "task-not-found" });
      return;
    }

    routeTrackingLog.error("safeStopLocationUpdates:failed", error);
  }
}

function assertLocationTaskDefined(): void {
  const taskDefined = TaskManager.isTaskDefined(ROUTE_LOCATION_TASK_NAME);
  routeTrackingLog.info("assertLocationTaskDefined", { taskDefined });

  if (!taskDefined) {
    throw new Error(
      "Instale a versão mais recente do app para rastrear o passeio em segundo plano.",
    );
  }
}

async function ensureAndroidNotificationPermission(): Promise<void> {
  if (Platform.OS !== "android") return;

  const Notifications = await import("expo-notifications").catch((error) => {
    routeTrackingLog.error("ensureAndroidNotificationPermission:import-failed", error);
    return null;
  });

  if (!Notifications) {
    routeTrackingLog.warn("ensureAndroidNotificationPermission:module-unavailable");
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  routeTrackingLog.info("ensureAndroidNotificationPermission:current", { status });

  if (status === "granted") return;

  const { status: requested } = await Notifications.requestPermissionsAsync();
  routeTrackingLog.info("ensureAndroidNotificationPermission:requested", { status: requested });

  if (requested !== "granted") {
    throw new Error(
      "Permita notificações para exibir o rastreamento em segundo plano enquanto o app está fechado.",
    );
  }
}

async function readTrackingSession(): Promise<RouteBackgroundTrackingSession | null> {
  const raw = await AsyncStorage.getItem(ROUTE_BACKGROUND_TRACKING_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as RouteBackgroundTrackingSession;
    if (!parsed.routeId?.trim()) return null;
    return {
      routeId: parsed.routeId,
      routeTitle: parsed.routeTitle?.trim() || "Passeio em andamento",
    };
  } catch (error) {
    routeTrackingLog.error("readTrackingSession:parse-failed", error, { raw });
    return null;
  }
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (!message.trim()) return false;
  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function toPendingLocation(
  session: RouteBackgroundTrackingSession,
  location: LocationObject,
): PendingRouteLocation {
  return {
    heading: location.coords.heading ?? 0,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    routeId: session.routeId,
    updatedAt: new Date().toISOString(),
  };
}

async function readPendingLocation(
  routeId: string,
): Promise<PendingRouteLocation | null> {
  const raw = await AsyncStorage.getItem(PENDING_LOCATION_KEY);
  if (!raw) return null;

  try {
    const pending = JSON.parse(raw) as PendingRouteLocation;
    if (pending.routeId !== routeId) {
      await AsyncStorage.removeItem(PENDING_LOCATION_KEY);
      return null;
    }
    if (
      typeof pending.latitude !== "number" ||
      typeof pending.longitude !== "number"
    ) {
      await AsyncStorage.removeItem(PENDING_LOCATION_KEY);
      return null;
    }
    return pending;
  } catch {
    await AsyncStorage.removeItem(PENDING_LOCATION_KEY);
    return null;
  }
}

async function savePendingLocation(pending: PendingRouteLocation): Promise<void> {
  await AsyncStorage.setItem(PENDING_LOCATION_KEY, JSON.stringify(pending));
}

async function clearPendingLocation(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_LOCATION_KEY);
}

async function patchLocationToApi(
  session: RouteBackgroundTrackingSession,
  payload: {
    heading: number;
    latitude: number;
    longitude: number;
  },
): Promise<"ok" | "stop" | "retry"> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    routeTrackingLog.warn("sendLocationToApi:missing-token", { routeId: session.routeId });
    return "stop";
  }

  try {
    const baseUrl = await getApiBaseUrlForTask();
    const response = await fetch(`${baseUrl}/routes/${session.routeId}/location`, {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    routeTrackingLog.info("sendLocationToApi:response", {
      latitude: payload.latitude,
      longitude: payload.longitude,
      routeId: session.routeId,
      status: response.status,
    });

    if (response.ok) {
      return "ok";
    }

    if ([400, 403, 404].includes(response.status)) {
      const responseBody = await response.text().catch(() => "");
      captureRouteError(
        new Error(`Falha ao enviar localização em background (${response.status})`),
        {
          latitude: payload.latitude,
          longitude: payload.longitude,
          responseBody: responseBody.slice(0, 500),
          routeId: session.routeId,
          source: "sendLocationToApi",
          status: response.status,
        },
      );
      return "stop";
    }

    // 5xx / outros: tenta de novo no próximo tick, sem spam no Sentry.
    return "retry";
  } catch (error) {
    if (isNetworkError(error)) {
      routeTrackingLog.warn("sendLocationToApi:network-retry", {
        message: error instanceof Error ? error.message : String(error),
        routeId: session.routeId,
      });
      return "retry";
    }

    captureRouteError(error, {
      latitude: payload.latitude,
      longitude: payload.longitude,
      routeId: session.routeId,
      source: "sendLocationToApi",
    });
    return "retry";
  }
}

async function sendLocationToApi(
  session: RouteBackgroundTrackingSession,
  location: LocationObject,
): Promise<boolean> {
  const pending = toPendingLocation(session, location);
  const result = await patchLocationToApi(session, pending);

  if (result === "ok") {
    await clearPendingLocation();
    return true;
  }

  if (result === "stop") {
    await clearPendingLocation();
    return false;
  }

  await savePendingLocation(pending);
  return true;
}

async function flushPendingLocationIfNeeded(
  session: RouteBackgroundTrackingSession,
): Promise<void> {
  const pending = await readPendingLocation(session.routeId);
  if (!pending) return;

  const result = await patchLocationToApi(session, pending);
  if (result === "ok") {
    await clearPendingLocation();
    routeTrackingLog.info("flushPendingLocation:sent", {
      routeId: session.routeId,
      updatedAt: pending.updatedAt,
    });
    return;
  }

  if (result === "stop") {
    await clearPendingLocation();
  }
}

export async function processBackgroundLocationTask({
  data,
  error,
}: TaskManagerTaskBody<{
  locations?: LocationObject[];
}>): Promise<void> {
  try {
    if (error) {
      if (isNetworkError(error) || isBenignLocationTaskError(error)) {
        routeTrackingLog.warn("processBackgroundLocationTask:task-error-ignored", {
          message: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      routeTrackingLog.error("processBackgroundLocationTask:task-error", error);
      captureRouteError(error, {
        source: "processBackgroundLocationTask",
      });
      return;
    }

    const session = await readTrackingSession();
    if (!session) {
      routeTrackingLog.warn("processBackgroundLocationTask:no-session");
      await clearPendingLocation();
      await safeStopLocationUpdates();
      return;
    }

    const locations = data?.locations ?? [];
    const latestLocation = locations[locations.length - 1];
    if (!latestLocation) {
      // Sem ponto novo: ainda tenta reenviar o pendente se a rede voltou.
      await flushPendingLocationIfNeeded(session);
      routeTrackingLog.warn("processBackgroundLocationTask:no-locations", {
        routeId: session.routeId,
      });
      return;
    }

    routeTrackingLog.info("processBackgroundLocationTask:location-received", {
      count: locations.length,
      latitude: latestLocation.coords.latitude,
      longitude: latestLocation.coords.longitude,
      routeId: session.routeId,
    });

    const shouldContinue = await sendLocationToApi(session, latestLocation);
    if (!shouldContinue) {
      routeTrackingLog.warn("processBackgroundLocationTask:stopping", {
        routeId: session.routeId,
      });
      await stopRouteBackgroundTracking();
    }
  } catch (error) {
    // Nunca deixar a task estourar (TaskManager spam / Sentry).
    if (isNetworkError(error)) {
      routeTrackingLog.warn("processBackgroundLocationTask:network-swallowed", {
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    routeTrackingLog.error("processBackgroundLocationTask:unhandled", error);
    captureRouteError(error, {
      source: "processBackgroundLocationTask:unhandled",
    });
  }
}

export async function isRouteBackgroundTrackingActiveForRoute(
  routeId: string,
): Promise<boolean> {
  const session = await readTrackingSession();
  if (!session || session.routeId !== routeId) {
    return false;
  }

  try {
    const isRegistered = await isLocationTaskRegistered();
    if (!isRegistered) {
      return false;
    }

    return hasLocationUpdatesStarted();
  } catch (error) {
    if (isBenignLocationTaskError(error)) {
      return false;
    }

    routeTrackingLog.error("isRouteBackgroundTrackingActiveForRoute:failed", error, { routeId });
    return false;
  }
}

export async function ensureRouteBackgroundTracking(
  routeId: string,
  routeTitle: string,
): Promise<{ wasAlreadyActive: boolean }> {
  routeTrackingLog.info("ensureRouteBackgroundTracking:start", { routeId, routeTitle });

  const isActive = await isRouteBackgroundTrackingActiveForRoute(routeId);
  routeTrackingLog.info("ensureRouteBackgroundTracking:status", {
    isActive,
    platform: Platform.OS,
  });

  // Android may report the task as running while the foreground-service
  // notification was killed (common after swiping the app away).
  if (isActive && Platform.OS !== "android") {
    routeTrackingLog.info("ensureRouteBackgroundTracking:skip-ios", { routeId });
    return { wasAlreadyActive: true };
  }

  const session = await readTrackingSession();
  if (session && session.routeId !== routeId) {
    routeTrackingLog.info("ensureRouteBackgroundTracking:switch-route", {
      fromRouteId: session.routeId,
      toRouteId: routeId,
    });
    await stopRouteBackgroundTracking();
  } else if (isActive) {
    routeTrackingLog.info("ensureRouteBackgroundTracking:restart-android", { routeId });
    await safeStopLocationUpdates();
  }

  await startRouteBackgroundTracking(routeId, routeTitle);

  const diagnostics = await getTrackingDiagnostics();
  routeTrackingLog.info("ensureRouteBackgroundTracking:done", {
    routeId,
    wasAlreadyActive: isActive,
    ...diagnostics,
  });

  return { wasAlreadyActive: isActive };
}

export async function isRouteBackgroundTrackingActive(): Promise<boolean> {
  const session = await readTrackingSession();
  if (!session) return false;

  try {
    const isRegistered = await isLocationTaskRegistered();
    if (!isRegistered) {
      return false;
    }

    return hasLocationUpdatesStarted();
  } catch (error) {
    if (isBenignLocationTaskError(error)) {
      return false;
    }

    routeTrackingLog.error("isRouteBackgroundTrackingActive:failed", error);
    return false;
  }
}

export async function getRouteBackgroundTrackingSession(): Promise<RouteBackgroundTrackingSession | null> {
  return readTrackingSession();
}

export async function startRouteBackgroundTracking(
  routeId: string,
  routeTitle: string,
): Promise<void> {
  routeTrackingLog.info("startRouteBackgroundTracking:start", { routeId, routeTitle });

  assertLocationTaskDefined();

  const foregroundPermission = await Location.requestForegroundPermissionsAsync();
  routeTrackingLog.info("startRouteBackgroundTracking:foreground-permission", {
    canAskAgain: foregroundPermission.canAskAgain,
    granted: foregroundPermission.granted,
    status: foregroundPermission.status,
  });

  if (!foregroundPermission.granted) {
    throw new Error("Permissão de localização necessária para rastrear o passeio");
  }

  const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
  routeTrackingLog.info("startRouteBackgroundTracking:background-permission", {
    canAskAgain: backgroundPermission.canAskAgain,
    granted: backgroundPermission.granted,
    status: backgroundPermission.status,
  });

  if (!backgroundPermission.granted) {
    throw new Error(
      "Permita localização em segundo plano para continuar sendo rastreado durante o passeio",
    );
  }

  const trackingLabel = routeTitle.trim() || "Passeio em andamento";

  await ensureAndroidNotificationPermission();
  await safeStopLocationUpdates();

  await AsyncStorage.setItem(
    ROUTE_BACKGROUND_TRACKING_KEY,
    JSON.stringify({ routeId, routeTitle: trackingLabel } satisfies RouteBackgroundTrackingSession),
  );

  try {
    routeTrackingLog.info("startRouteBackgroundTracking:startLocationUpdatesAsync", {
      notificationTitle: `Rastreando: ${trackingLabel}`,
      routeId,
      taskName: ROUTE_LOCATION_TASK_NAME,
    });

    await Location.startLocationUpdatesAsync(ROUTE_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10,
      foregroundService: {
        notificationBody: "Seus parceiros podem ver onde você está neste passeio.",
        notificationColor: "#C8F763",
        notificationTitle: `Rastreando: ${trackingLabel}`,
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      timeInterval: 5000,
    });
  } catch (error) {
    routeTrackingLog.error("startRouteBackgroundTracking:startLocationUpdatesAsync-failed", error, {
      routeId,
    });
    throw error;
  }

  const diagnostics = await getTrackingDiagnostics();
  routeTrackingLog.info("startRouteBackgroundTracking:done", {
    routeId,
    ...diagnostics,
  });
}

export async function stopRouteBackgroundTracking(): Promise<void> {
  routeTrackingLog.info("stopRouteBackgroundTracking:start");
  await AsyncStorage.multiRemove([
    ROUTE_BACKGROUND_TRACKING_KEY,
    PENDING_LOCATION_KEY,
  ]);
  await safeStopLocationUpdates();
  routeTrackingLog.info("stopRouteBackgroundTracking:done");
}

export async function resumeRouteBackgroundTrackingIfNeeded(): Promise<void> {
  routeTrackingLog.info("resumeRouteBackgroundTrackingIfNeeded:start");

  if (!TaskManager.isTaskDefined(ROUTE_LOCATION_TASK_NAME)) {
    routeTrackingLog.warn("resumeRouteBackgroundTrackingIfNeeded:task-not-defined");
    await AsyncStorage.removeItem(ROUTE_BACKGROUND_TRACKING_KEY);
    return;
  }

  const session = await readTrackingSession();
  if (!session) {
    routeTrackingLog.info("resumeRouteBackgroundTrackingIfNeeded:no-session");
    return;
  }

  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    routeTrackingLog.warn("resumeRouteBackgroundTrackingIfNeeded:missing-token");
    await stopRouteBackgroundTracking();
    return;
  }

  try {
    const baseUrl = await getApiBaseUrlForTask();
    const response = await fetch(`${baseUrl}/routes/${session.routeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    routeTrackingLog.info("resumeRouteBackgroundTrackingIfNeeded:route-status", {
      routeId: session.routeId,
      status: response.status,
    });

    if (!response.ok) {
      await stopRouteBackgroundTracking();
      return;
    }

    const route = (await response.json()) as { status?: string };
    if (route.status !== "in_progress") {
      routeTrackingLog.info("resumeRouteBackgroundTrackingIfNeeded:route-not-in-progress", {
        routeId: session.routeId,
        status: route.status,
      });
      await stopRouteBackgroundTracking();
      return;
    }

    const isRunning = await hasLocationUpdatesStarted();
    routeTrackingLog.info("resumeRouteBackgroundTrackingIfNeeded:task-running", {
      isRunning,
      platform: Platform.OS,
      routeId: session.routeId,
    });

    await flushPendingLocationIfNeeded(session);

    if (!isRunning || Platform.OS === "android") {
      await ensureRouteBackgroundTracking(session.routeId, session.routeTitle);
    }
  } catch (error) {
    if (isNetworkError(error)) {
      routeTrackingLog.warn("resumeRouteBackgroundTrackingIfNeeded:network", {
        message: error instanceof Error ? error.message : String(error),
        routeId: session.routeId,
      });
      return;
    }

    routeTrackingLog.error("resumeRouteBackgroundTrackingIfNeeded:failed", error, {
      routeId: session.routeId,
    });
  }
}

export function registerRouteLocationTask(): void {
  if (TaskManager.isTaskDefined(ROUTE_LOCATION_TASK_NAME)) {
    routeTrackingLog.info("registerRouteLocationTask:already-defined");
    return;
  }

  routeTrackingLog.info("registerRouteLocationTask:defining");
  TaskManager.defineTask(ROUTE_LOCATION_TASK_NAME, processBackgroundLocationTask);
}
