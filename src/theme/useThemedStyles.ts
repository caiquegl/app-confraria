import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useTheme } from "./ThemeProvider";
import type { AppColors } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThemedStyles(factory: (colors: AppColors) => Record<string, unknown>): any {
  const { colors } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMemo(() => StyleSheet.create(factory(colors) as any), [colors, factory]);
}
