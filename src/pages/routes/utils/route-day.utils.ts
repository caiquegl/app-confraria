import type { RouteDraftDay, RouteDraftStop, SheetState } from "../types/route-create.types";

const DAY_COLORS = ["#B8E43A", "#9FC132", "#7CB342", "#5775C8", "#F59E0B", "#EF4444"];

export const SHEET_HEIGHT_RATIO: Record<SheetState, number> = {
  compact: 0.28,
  full: 1,
  normal: 0.62,
};

export function getSheetHeight(
  windowHeight: number,
  sheetState: SheetState,
  bottomInset = 0,
  topInset = 0,
): number {
  const availableHeight = Math.max(windowHeight - bottomInset - topInset, 0);

  // Full sheet must leave top inset free so the collapse handle stays tappable.
  if (sheetState === "full") {
    return availableHeight;
  }

  return availableHeight * SHEET_HEIGHT_RATIO[sheetState];
}

export function createRouteDayDraft(index: number): RouteDraftDay {
  return {
    destination: null,
    id: `day-${index + 1}`,
    label: `Dia ${index + 1}`,
    origin: null,
    overnight: false,
    stops: [],
  };
}

export function createRouteStop(): RouteDraftStop {
  return {
    id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    place: null,
  };
}

export function getDayColor(dayIndex: number): string {
  return DAY_COLORS[dayIndex % DAY_COLORS.length];
}

export function cycleSheetState(current: SheetState): SheetState {
  if (current === "normal") return "full";
  if (current === "full") return "compact";
  return "normal";
}
