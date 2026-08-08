import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type RouteReportType =
  | "traffic"
  | "police"
  | "accident"
  | "hazard"
  | "lane_closed"
  | "map_error"
  | "bad_weather";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type RouteReportTypeConfig = {
  type: RouteReportType;
  label: string;
  icon: IoniconName;
  color: string;
};

// Os 7 tipos ativos nesta entrega (CON-32). Demais tipos (combustivel, sos,
// local, debug, via interditada) ficam para depois.
export const ROUTE_REPORT_TYPES: RouteReportTypeConfig[] = [
  { type: "traffic", label: "Trânsito", icon: "car", color: "#F59E0B" },
  { type: "police", label: "Polícia", icon: "shield-half", color: "#2563EB" },
  { type: "accident", label: "Acidente", icon: "warning", color: "#EF4444" },
  { type: "hazard", label: "Perigo", icon: "alert-circle", color: "#F97316" },
  { type: "lane_closed", label: "Faixa bloqueada", icon: "remove-circle", color: "#DC2626" },
  { type: "map_error", label: "Erro no mapa", icon: "map", color: "#6B7280" },
  { type: "bad_weather", label: "Tempo ruim", icon: "rainy", color: "#0EA5E9" },
];

export const ROUTE_REPORT_TYPE_BY_KEY: Record<RouteReportType, RouteReportTypeConfig> =
  ROUTE_REPORT_TYPES.reduce(
    (acc, item) => {
      acc[item.type] = item;
      return acc;
    },
    {} as Record<RouteReportType, RouteReportTypeConfig>,
  );
