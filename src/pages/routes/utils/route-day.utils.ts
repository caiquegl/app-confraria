import { getRouteDayPalette, lightColors } from "@/theme/colors";
import type { AppColors } from "@/theme";

import type { RouteDraftDay, RouteDraftStop, SheetState } from "../types/route-create.types";

export const SHEET_HEIGHT_RATIO: Record<SheetState, number> = {
  compact: 0.28,
  full: 1,
  normal: 0.62,
};

/** paddingTop (8) + botão (48) + folga abaixo do voltar (12). */
export const PLANNER_BACK_BUTTON_CLEARANCE = 8 + 48 + 12;

export type PlannerSheetDetentHeights = Record<SheetState, number> & {
  maxHeight: number;
  minHeight: number;
};

export function getPlannerSheetDetentHeights(
  windowHeight: number,
  bottomInset = 0,
  topInset = 0,
  backButtonClearance = PLANNER_BACK_BUTTON_CLEARANCE,
): PlannerSheetDetentHeights {
  const availableHeight = Math.max(windowHeight - bottomInset - topInset, 0);
  const compact = SHEET_HEIGHT_RATIO.compact * availableHeight;
  const normal = SHEET_HEIGHT_RATIO.normal * availableHeight;
  const maxHeight = Math.max(compact, availableHeight - backButtonClearance);
  const full = Math.min(availableHeight * SHEET_HEIGHT_RATIO.full, maxHeight);

  return {
    compact,
    full,
    maxHeight,
    minHeight: compact,
    normal: Math.min(normal, maxHeight),
  };
}

export function getSheetHeight(
  windowHeight: number,
  sheetState: SheetState,
  bottomInset = 0,
  topInset = 0,
): number {
  return getPlannerSheetDetentHeights(windowHeight, bottomInset, topInset)[sheetState];
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

export function getDayColor(dayIndex: number, colors: AppColors = lightColors): string {
  const palette = getRouteDayPalette(colors);
  return palette[dayIndex % palette.length];
}

export function cycleSheetState(current: SheetState): SheetState {
  if (current === "normal") return "full";
  if (current === "full") return "compact";
  return "normal";
}
