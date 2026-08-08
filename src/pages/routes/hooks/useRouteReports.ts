import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";

import {
  emitRouteReport,
  subscribeRouteReportCreated,
  subscribeRouteReportsSnapshot,
  type RouteLiveReport,
} from "@/lib/route-navigation-socket";

import type { RouteReportType } from "../utils/route-report-types";

type UseRouteReportsParams = {
  enabled: boolean;
  routeId: string;
};

export function useRouteReports({ enabled, routeId }: UseRouteReportsParams) {
  const [reports, setReports] = useState<RouteLiveReport[]>([]);

  useEffect(() => {
    if (!enabled || !routeId) {
      setReports([]);
      return;
    }

    let mounted = true;

    const unsubscribeSnapshot = subscribeRouteReportsSnapshot((payload) => {
      if (!mounted || payload.routeId !== routeId) return;
      setReports(payload.reports);
    });

    const unsubscribeCreated = subscribeRouteReportCreated((report) => {
      if (!mounted) return;
      setReports((current) => {
        const next = current.filter((item) => item.id !== report.id);
        return [report, ...next];
      });
    });

    return () => {
      mounted = false;
      unsubscribeSnapshot();
      unsubscribeCreated();
    };
  }, [enabled, routeId]);

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

      try {
        await emitRouteReport({
          latitude: coords.latitude,
          longitude: coords.longitude,
          routeId,
          type,
        });
        Toast.show({
          type: "success",
          text1: "Reporte enviado",
          text2: "Os pilotos da rota foram avisados.",
          visibilityTime: 2500,
        });
      } catch {
        Toast.show({
          type: "error",
          text1: "Falha ao reportar",
          text2: "Tente novamente em instantes.",
        });
      }
    },
    [routeId],
  );

  return { reports, sendReport };
}
