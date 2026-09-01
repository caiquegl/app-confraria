import { darkColors } from "./palettes/dark";
import { lightColors } from "./palettes/light";
import { getColors } from "./theme-store";
import type { AppColors } from "./types";

/** @deprecated Prefira `useTheme().colors` para suporte a dark mode. */
export const colors: AppColors = lightColors;

export { darkColors, lightColors, getColors };
export type { AppColors, ColorScheme } from "./types";

export function getRouteDayPalette(palette: AppColors) {
  return [
    palette.routes.paletteLime,
    palette.accent.shadow,
    palette.routes.paletteGreen,
    palette.routes.paletteIndigo,
    palette.rating.star,
    palette.feedback.danger,
  ] as const;
}

export function getRouteMiniStrokes(palette: AppColors) {
  return [
    palette.routes.paletteLime,
    palette.routes.paletteCyan,
    palette.routes.paletteCoral,
    palette.brandActive,
    palette.routes.paletteViolet,
  ] as const;
}

/** @deprecated Use `getRouteDayPalette(useTheme().colors)`. */
export const routeDayPalette = getRouteDayPalette(lightColors);

/** @deprecated Use `getRouteMiniStrokes(useTheme().colors)`. */
export const routeMiniStrokes = getRouteMiniStrokes(lightColors);
