import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Appearance, Platform, StatusBar } from "react-native";
import * as SystemUI from "expo-system-ui";

import {
  getColorScheme,
  getColors,
  getIsThemeHydrated,
  hydrateColorScheme,
  setColorScheme,
  subscribeColorScheme,
  toggleColorScheme,
} from "./theme-store";
import type { AppColors, ColorScheme } from "./types";

type ThemeContextValue = {
  colors: AppColors;
  colorScheme: ColorScheme;
  isDark: boolean;
  isHydrated: boolean;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  toggleColorScheme: () => Promise<ColorScheme>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useSyncExternalStore(
    subscribeColorScheme,
    getColorScheme,
    () => "light" as ColorScheme,
  );
  const isHydrated = useSyncExternalStore(
    subscribeColorScheme,
    getIsThemeHydrated,
    () => false,
  );

  useEffect(() => {
    void hydrateColorScheme();
  }, []);

  useEffect(() => {
    const colors = getColors(colorScheme);

    if (Platform.OS === "android") {
      StatusBar.setBarStyle(colorScheme === "dark" ? "light-content" : "dark-content");
    }

    void SystemUI.setBackgroundColorAsync(colors.surface.canvas);
  }, [colorScheme]);

  const handleSetColorScheme = useCallback(async (scheme: ColorScheme) => {
    await setColorScheme(scheme);
  }, []);

  const handleToggleColorScheme = useCallback(async () => {
    return toggleColorScheme();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: getColors(colorScheme),
      colorScheme,
      isDark: colorScheme === "dark",
      isHydrated,
      setColorScheme: handleSetColorScheme,
      toggleColorScheme: handleToggleColorScheme,
    }),
    [colorScheme, handleSetColorScheme, handleToggleColorScheme, isHydrated],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }
  return context;
}

/** Hook seguro fora do provider (ex.: utilitários legados). */
export function useThemeColors(): AppColors {
  const context = useContext(ThemeContext);
  if (context) return context.colors;
  return getColors(getColorScheme());
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribeColorScheme, getColorScheme, () => "light");
}

/** Sincroniza com preferência do sistema quando o usuário não escolheu manualmente. */
export function useSystemColorSchemeSync(enabled = false) {
  useEffect(() => {
    if (!enabled) return;

    const subscription = Appearance.addChangeListener(({ colorScheme: systemScheme }) => {
      if (!systemScheme) return;
      void setColorScheme(systemScheme === "dark" ? "dark" : "light");
    });

    return () => subscription.remove();
  }, [enabled]);
}
