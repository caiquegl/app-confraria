export const ROUTE_STYLES = ["direct", "winding", "super_winding"] as const;

export type RouteStyle = (typeof ROUTE_STYLES)[number];

export const DEFAULT_ROUTE_STYLE: RouteStyle = "direct";

export const ROUTE_STYLE_LABELS: Record<RouteStyle, string> = {
  direct: "Direto",
  super_winding: "Super-sinuoso",
  winding: "Sinuoso",
};

export function isRouteStyle(value: unknown): value is RouteStyle {
  return value === "direct" || value === "winding" || value === "super_winding";
}

export function parseRouteStyle(value?: string | null): RouteStyle {
  return isRouteStyle(value) ? value : DEFAULT_ROUTE_STYLE;
}

export function isPremiumRouteStyle(
  style: RouteStyle,
): style is Exclude<RouteStyle, "direct"> {
  return style !== "direct";
}
