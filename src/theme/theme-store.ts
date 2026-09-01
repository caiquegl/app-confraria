import AsyncStorage from "@react-native-async-storage/async-storage";

import { darkColors } from "./palettes/dark";
import { lightColors } from "./palettes/light";
import type { AppColors, ColorScheme } from "./types";

export const THEME_STORAGE_KEY = "@confraria/color-scheme";

type Listener = () => void;

let colorScheme: ColorScheme = "light";
let isHydrated = false;
const listeners = new Set<Listener>();

export function getColorScheme(): ColorScheme {
  return colorScheme;
}

export function getIsThemeHydrated(): boolean {
  return isHydrated;
}

export function getColors(scheme: ColorScheme = colorScheme): AppColors {
  return scheme === "dark" ? darkColors : lightColors;
}

export function subscribeColorScheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export async function hydrateColorScheme(): Promise<ColorScheme> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      colorScheme = stored;
    }
  } catch {
    // Mantém light como fallback.
  } finally {
    isHydrated = true;
    notifyListeners();
  }

  return colorScheme;
}

export async function setColorScheme(next: ColorScheme): Promise<void> {
  if (next === colorScheme) return;

  colorScheme = next;
  notifyListeners();

  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Preferência não persistida — tema ainda aplica na sessão.
  }
}

export async function toggleColorScheme(): Promise<ColorScheme> {
  const next = colorScheme === "dark" ? "light" : "dark";
  await setColorScheme(next);
  return next;
}
