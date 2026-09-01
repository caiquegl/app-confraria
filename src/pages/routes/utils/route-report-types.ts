import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import type { AppColors } from "@/theme";

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
export function getRouteReportTypes(colors: AppColors): RouteReportTypeConfig[] {
  return [
    { type: "traffic", label: "Trânsito", icon: "car", color: colors.rating.star },
    { type: "police", label: "Polícia", icon: "shield-half", color: colors.routes.pinPolice },
    { type: "accident", label: "Acidente", icon: "warning", color: colors.feedback.danger },
    { type: "hazard", label: "Perigo", icon: "alert-circle", color: colors.routes.pinOrange },
    {
      type: "lane_closed",
      label: "Faixa bloqueada",
      icon: "remove-circle",
      color: colors.feedback.dangerStrong,
    },
    { type: "map_error", label: "Erro no mapa", icon: "map", color: colors.text.secondary },
    { type: "bad_weather", label: "Tempo ruim", icon: "rainy", color: colors.routes.pinSky },
  ];
}

export function getRouteReportTypeByKey(
  colors: AppColors,
): Record<RouteReportType, RouteReportTypeConfig> {
  return getRouteReportTypes(colors).reduce(
    (acc, item) => {
      acc[item.type] = item;
      return acc;
    },
    {} as Record<RouteReportType, RouteReportTypeConfig>,
  );
}
