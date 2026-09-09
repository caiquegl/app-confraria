import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import { appLog } from "@/lib/app-log";
import {
  emitRouteReport,
  subscribeRouteNavigationConnected,
  subscribeRouteReportCreated,
  subscribeRouteReportsSnapshot,
  type RouteLiveReport,
} from "@/lib/route-navigation-socket";

import type { RouteReportType } from "../utils/route-report-types";

type UseRouteReportsParams = {
  enabled: boolean;
  routeId: string;
};

export type RouteReportDeliveryStatus = "sending" | "sent" | "failed";

export type RouteReportListItem = RouteLiveReport & {
  deliveryStatus?: RouteReportDeliveryStatus;
};

type QueuedRouteReport = {
  clientReportId: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  routeId: string;
  type: RouteReportType;
};

const REPORT_RETRY_STORAGE_KEY = "@confraria/route_report_retry_queue";
const REPORT_RETRY_TTL_MS = 20 * 60 * 1000;

function createClientReportId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function reportsMatch(left: RouteReportListItem, right: RouteReportListItem): boolean {
  if (left.id === right.id) return true;
  const leftClientId = left.clientReportId;
  const rightClientId = right.clientReportId;
  return Boolean(leftClientId && rightClientId && leftClientId === rightClientId);
}

function mergeReport(
  current: RouteReportListItem[],
  incoming: RouteReportListItem,
): RouteReportListItem[] {
  const existingIndex = current.findIndex((item) => reportsMatch(item, incoming));
  if (existingIndex === -1) {
    return [incoming, ...current];
  }

  const next = [...current];
  next[existingIndex] = {
    ...next[existingIndex],
    ...incoming,
    deliveryStatus: incoming.deliveryStatus ?? next[existingIndex]?.deliveryStatus ?? "sent",
  };
  return next;
}

function isFreshQueueItem(item: QueuedRouteReport): boolean {
  const createdAt = Date.parse(item.createdAt);
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt <= REPORT_RETRY_TTL_MS;
}

async function readRetryQueue(routeId: string): Promise<QueuedRouteReport[]> {
  try {
    const raw = await AsyncStorage.getItem(REPORT_RETRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedRouteReport[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        item.routeId === routeId &&
        typeof item.clientReportId === "string" &&
        isFreshQueueItem(item),
    );
  } catch {
    return [];
  }
}

async function writeRetryQueue(items: QueuedRouteReport[]): Promise<void> {
  const fresh = items.filter(isFreshQueueItem);
  if (fresh.length === 0) {
    await AsyncStorage.removeItem(REPORT_RETRY_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(REPORT_RETRY_STORAGE_KEY, JSON.stringify(fresh));
}

async function upsertRetryQueueItem(item: QueuedRouteReport): Promise<void> {
  const current = await readRetryQueue(item.routeId);
  const next = [
    item,
    ...current.filter((entry) => entry.clientReportId !== item.clientReportId),
  ];
  await writeRetryQueue(next);
}

async function removeRetryQueueItem(routeId: string, clientReportId: string): Promise<void> {
  const current = await readRetryQueue(routeId);
  await writeRetryQueue(current.filter((item) => item.clientReportId !== clientReportId));
}

export function useRouteReports({ enabled, routeId }: UseRouteReportsParams) {
  const [reports, setReports] = useState<RouteReportListItem[]>([]);
  const [failedReports, setFailedReports] = useState<QueuedRouteReport[]>([]);
  const flushInFlightRef = useRef(false);

  const syncFailedFromStorage = useCallback(async () => {
    if (!routeId) {
      setFailedReports([]);
      return;
    }
    const queued = await readRetryQueue(routeId);
    setFailedReports(queued);
  }, [routeId]);

  useEffect(() => {
    if (!enabled || !routeId) {
      setReports([]);
      setFailedReports([]);
      return;
    }

    let mounted = true;

    void syncFailedFromStorage();

    const unsubscribeSnapshot = subscribeRouteReportsSnapshot((payload) => {
      if (!mounted || payload.routeId !== routeId) return;
      setReports((current) => {
        const localPending = current.filter(
          (item) =>
            item.deliveryStatus === "sending" ||
            item.deliveryStatus === "failed" ||
            item.id.startsWith("local:"),
        );
        let next = payload.reports.map((item) => ({
          ...item,
          deliveryStatus: "sent" as const,
        }));
        for (const pending of localPending) {
          next = mergeReport(next, pending);
        }
        return next;
      });
    });

    const unsubscribeCreated = subscribeRouteReportCreated((report) => {
      if (!mounted) return;
      setReports((current) =>
        mergeReport(current, {
          ...report,
          deliveryStatus: "sent",
        }),
      );
    });

    return () => {
      mounted = false;
      unsubscribeSnapshot();
      unsubscribeCreated();
    };
  }, [enabled, routeId, syncFailedFromStorage]);

  const sendQueuedReport = useCallback(
    async (queued: QueuedRouteReport, options?: { isRetry?: boolean }) => {
      const optimistic: RouteReportListItem = {
        avatarUrl: null,
        clientReportId: queued.clientReportId,
        createdAt: queued.createdAt,
        deliveryStatus: "sending",
        id: `local:${queued.clientReportId}`,
        latitude: queued.latitude,
        longitude: queued.longitude,
        name: "Você",
        type: queued.type,
        userId: "local",
      };

      setReports((current) => mergeReport(current, optimistic));

      try {
        const ack = await emitRouteReport({
          clientReportId: queued.clientReportId,
          latitude: queued.latitude,
          longitude: queued.longitude,
          routeId: queued.routeId,
          type: queued.type,
        });

        await removeRetryQueueItem(queued.routeId, queued.clientReportId);
        await syncFailedFromStorage();

        setReports((current) =>
          mergeReport(current, {
            ...ack,
            deliveryStatus: "sent",
          }),
        );

        appLog.info(options?.isRetry ? "route.report.retry" : "route.report.ack_ok", {
          clientReportId: queued.clientReportId,
          reportId: ack.id,
          routeId: queued.routeId,
          type: queued.type,
        });

        Toast.show({
          type: "success",
          text1: "Reporte enviado",
          text2: "Os pilotos da rota foram avisados.",
          visibilityTime: 2500,
        });

        return true;
      } catch (error) {
        await upsertRetryQueueItem(queued);
        await syncFailedFromStorage();

        setReports((current) =>
          mergeReport(current, {
            ...optimistic,
            deliveryStatus: "failed",
          }),
        );

        appLog.warn("route.report.ack_fail", {
          clientReportId: queued.clientReportId,
          message: error instanceof Error ? error.message : String(error),
          routeId: queued.routeId,
          type: queued.type,
        });

        Toast.show({
          type: "error",
          text1: "Falha ao reportar",
          text2: "Toque em Reenviar quando a rede voltar.",
        });

        return false;
      }
    },
    [syncFailedFromStorage],
  );

  const flushRetryQueue = useCallback(async () => {
    if (!enabled || !routeId || flushInFlightRef.current) return;
    flushInFlightRef.current = true;

    try {
      const queued = await readRetryQueue(routeId);
      for (const item of queued) {
        await sendQueuedReport(item, { isRetry: true });
      }
    } finally {
      flushInFlightRef.current = false;
    }
  }, [enabled, routeId, sendQueuedReport]);

  useEffect(() => {
    if (!enabled || !routeId) return;

    const unsubscribe = subscribeRouteNavigationConnected(() => {
      void flushRetryQueue();
    });

    return unsubscribe;
  }, [enabled, flushRetryQueue, routeId]);

  const sendReport = useCallback(
    async (
      type: RouteReportType,
      coords: { latitude: number; longitude: number } | null,
    ) => {
      if (!coords) {
        Toast.show({
          type: "error",
          text1: "Sem localização",
          text2: "Não foi possível obter sua posição para o reporte.",
        });
        return;
      }

      const queued: QueuedRouteReport = {
        clientReportId: createClientReportId(),
        createdAt: new Date().toISOString(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        routeId,
        type,
      };

      await sendQueuedReport(queued);
    },
    [routeId, sendQueuedReport],
  );

  const retryFailedReport = useCallback(
    async (clientReportId: string) => {
      const queued =
        failedReports.find((item) => item.clientReportId === clientReportId) ??
        (await readRetryQueue(routeId)).find((item) => item.clientReportId === clientReportId);

      if (!queued) return;
      appLog.info("route.report.retry", {
        clientReportId,
        routeId,
        type: queued.type,
      });
      await sendQueuedReport(queued, { isRetry: true });
    },
    [failedReports, routeId, sendQueuedReport],
  );

  return {
    failedReports,
    reports,
    retryFailedReport,
    sendReport,
  };
}
