import type { AppColors } from "../types";

/**
 * Paleta escura alinhada ao Confraria DS (Slate + Confraria).
 * @see https://confraria-ui-playground.vercel.app/docs/tokens/colors
 */
export const darkColors: AppColors = {
  brandGreen: "#C8F763",
  brandDark: "#F8FAFC",
  brandGray: "#0F172A",
  brandPrimary: "#3C4B1C",
  brandActive: "#728F21",

  text: {
    primary: "#F8FAFC",
    secondary: "#94A3B8",
    muted: "#64748B",
    placeholder: "#64748B",
    placeholderMuted: "#475569",
    inverse: "#0F172A",
    body: "#CBD5E1",
    comment: "#94A3B8",
    emphasis: "#F8FAFC",
    info: "#93C5FD",
    overnight: "#60A5FA",
    success: "#86EFAC",
    onBrand: "#3C4B1C",
  },

  surface: {
    primary: "#1E293B",
    subtle: "#334155",
    disabled: "#0F172A",
    canvas: "#0F172A",
    dangerSubtle: "#450A0A",
    brandSubtle: "#3C4B1C",
    brandMuted: "#2A3320",
    brandTint: "rgba(159, 193, 50, 0.16)",
    brandTintLight: "rgba(159, 193, 50, 0.08)",
    brandTintFaint: "rgba(159, 193, 50, 0.1)",
    brandTintSoft: "rgba(159, 193, 50, 0.12)",
    brandTintStrong: "rgba(159, 193, 50, 0.22)",
    brandTintBold: "rgba(159, 193, 50, 0.28)",
    infoSubtle: "#1E3A8A",
    overnight: "#1E3A5F",
    preview: "#1E293B",
    primaryTint: "rgba(159, 193, 50, 0.1)",
    quickRideBadge: "#3C4B1C",
    routesCanvas: "#14181C",
    successSubtle: "#14532D",
    media: "#334155",
    video: "#000000",
    videoFallback: "#0F172A",
  },

  border: {
    subtle: "#334155",
    default: "#475569",
    brand: "#576D1E",
    brandActive: "rgba(159, 193, 50, 0.55)",
    brandTint: "rgba(159, 193, 50, 0.28)",
    brandLight: "#3C4B1C",
    divider: "#1E293B",
    dividerStrong: "#334155",
  },

  feedback: {
    danger: "#F87171",
    dangerForeground: "#F8FAFC",
    dangerStrong: "#EF4444",
    dangerBorder: "#991B1B",
    dangerDivider: "#450A0A",
  },

  overlay: {
    scrim: "rgba(0,0,0,0.65)",
    scrimMedium: "rgba(0,0,0,0.55)",
    scrimLight: "rgba(0,0,0,0.45)",
    scrimSoft: "rgba(0,0,0,0.5)",
    scrimStrong: "rgba(0,0,0,0.72)",
    scrimHeavy: "rgba(0,0,0,0.78)",
    videoScrim: "rgba(0,0,0,0.55)",
    dotIdle: "rgba(255,255,255,0.4)",
    control: "rgba(15,23,42,0.92)",
    uploadCard: "rgba(15,23,42,0.96)",
    borderLight: "rgba(255,255,255,0.16)",
    borderFaint: "rgba(255,255,255,0.1)",
    dividerFaint: "rgba(255,255,255,0.08)",
    iconFrosted: "rgba(255,255,255,0.12)",
    textMuted: "rgba(255,255,255,0.6)",
    textSecondary: "rgba(255,255,255,0.72)",
  },

  accent: {
    brand: "#9FC132",
    shadow: "#728F21",
  },

  rating: {
    star: "#FBBF24",
    accent: "#FB923C",
  },

  status: {
    open: "#4ADE80",
  },

  thirdParty: {
    googleBlue: "#4285F4",
    googleGreen: "#34A853",
    googleYellow: "#FBBC05",
    googleRed: "#EA4335",
    facebook: "#1877F2",
  },

  map: {
    plannerLandscape: "#1a1d21",
    plannerWater: "#17263c",
    plannerRoadStroke: "#212a33",
    plannerHighwayStroke: "#38414a",
    plannerVignette: "rgba(15, 17, 20, 0.35)",
    plannerPolylineAlternative: "rgba(159, 193, 50, 0.45)",
    navigationGeometry: "#1f2428",
    navigationLabelFill: "#8a9199",
    navigationLabelStroke: "#1f2428",
    navigationRoad: "#38414a",
    navigationRoadStroke: "#212a33",
    navigationWater: "#17263c",
    navigationPolylineCompleted: "rgba(159, 193, 50, 0.35)",
    navigationPinLabel: "rgba(248, 250, 252, 0.92)",
    frosted: "rgba(30, 41, 59, 0.94)",
    photoScrim: "rgba(0,0,0,0.96)",
    modalScrim: "rgba(0, 0, 0, 0.65)",
    overlayLight: "rgba(15, 23, 42, 0.72)",
  },

  routes: {
    paletteLime: "#B8E43A",
    paletteCyan: "#5FB6FF",
    paletteCoral: "#FF8A5B",
    paletteViolet: "#9D8CFF",
    paletteGreen: "#7CB342",
    paletteIndigo: "#5775C8",
    pinMechanic: "#A78BFA",
    pinOrange: "#FB923C",
    pinSky: "#38BDF8",
    pinPolice: "#60A5FA",
    sponsoredBackground: "#422006",
    sponsoredText: "#FCD34D",
    suggestionSuccessText: "#86EFAC",
    suggestionInfoBackground: "#1E3A5F",
    suggestionInfoText: "#7DD3FC",
    suggestionWarningBackground: "#422006",
    suggestionWarningText: "#FCD34D",
    suggestionHighlightBackground: "rgba(20, 83, 45, 0.45)",
    suggestionHighlightBorder: "#166534",
  },

  navigation: {
    offRouteWarning: "#FBBF24",
    offRouteManeuver: "#60A5FA",
    upcomingManeuver: "#A3E635",
  },
};
