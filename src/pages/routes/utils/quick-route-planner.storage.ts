import AsyncStorage from "@react-native-async-storage/async-storage";

import type { QuickRoutePlannerSnapshot } from "../types/quick-route.types";

const QUICK_ROUTE_PLANNER_KEY = "@confraria/quick-route-planner";

export async function saveQuickRoutePlannerSnapshot(
  snapshot: QuickRoutePlannerSnapshot,
): Promise<void> {
  await AsyncStorage.setItem(QUICK_ROUTE_PLANNER_KEY, JSON.stringify(snapshot));
}

export async function loadQuickRoutePlannerSnapshot(): Promise<QuickRoutePlannerSnapshot | null> {
  const raw = await AsyncStorage.getItem(QUICK_ROUTE_PLANNER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as QuickRoutePlannerSnapshot;
  } catch {
    return null;
  }
}

export async function clearQuickRoutePlannerSnapshot(): Promise<void> {
  await AsyncStorage.removeItem(QUICK_ROUTE_PLANNER_KEY);
}
