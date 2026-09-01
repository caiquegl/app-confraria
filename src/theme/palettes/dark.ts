import type { AppColors } from "../types";

/**
 * Paleta escura — o protótipo não define dark mode; derivada de:
 * - `brand-dark` (#1C2126) e wireframes (#0F0F0F–#2A2A2A)
 * - estilo noturno do mapa (`map.navigation*`)
 * - acentos de marca preservados (verde Confraria)
 */
export const darkColors: AppColors = {
  brandGreen: "#C8F763",
  brandDark: "#F5F7F5",
  brandGray: "#0F1114",
  brandPrimary: "#C8F763",
  brandActive: "#9FC132",

  text: {
    primary: "#F5F7F5",
    secondary: "#9CA3AF",
    muted: "#7B8493",
    placeholder: "#6B7280",
    placeholderMuted: "#6B7280",
    inverse: "#1C2126",
    body: "#D1D5DB",
    comment: "#9CA3AF",
    emphasis: "#FFFFFF",
    info: "#A5B4FC",
    overnight: "#93B4FF",
    success: "#86EFAC",
  },

  surface: {
    primary: "#1C2126",
    subtle: "#252B31",
    disabled: "#1A1F24",
    canvas: "#0F1114",
    dangerSubtle: "#3F1D1D",
    brandSubtle: "#2A3320",
    brandMuted: "#1F2618",
    brandTint: "rgba(200, 247, 99, 0.16)",
    brandTintLight: "rgba(200, 247, 99, 0.08)",
    brandTintFaint: "rgba(200, 247, 99, 0.1)",
    brandTintSoft: "rgba(200, 247, 99, 0.12)",
    brandTintStrong: "rgba(200, 247, 99, 0.22)",
    brandTintBold: "rgba(200, 247, 99, 0.28)",
    infoSubtle: "#1E293B",
    overnight: "#1A2744",
    preview: "#1A1F24",
    primaryTint: "rgba(200, 247, 99, 0.1)",
    quickRideBadge: "#2A3320",
    routesCanvas: "#14181C",
    successSubtle: "#14532D",
    media: "#2A3138",
    video: "#000000",
    videoFallback: "#0F1114",
  },

  border: {
    subtle: "#2A3138",
    default: "#3D4650",
    brand: "#3C4B33",
    brandActive: "rgba(200, 247, 99, 0.55)",
    brandTint: "rgba(200, 247, 99, 0.28)",
    brandLight: "#2A3320",
    divider: "#252B31",
    dividerStrong: "#2A3138",
  },

  feedback: {
    danger: "#F87171",
    dangerForeground: "#1C2126",
    dangerStrong: "#EF4444",
    dangerBorder: "#7F1D1D",
    dangerDivider: "#3F1D1D",
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
    control: "rgba(15,17,20,0.92)",
    uploadCard: "rgba(15,17,20,0.96)",
    borderLight: "rgba(255,255,255,0.16)",
    borderFaint: "rgba(255,255,255,0.1)",
    dividerFaint: "rgba(255,255,255,0.08)",
    iconFrosted: "rgba(255,255,255,0.12)",
    textMuted: "rgba(255,255,255,0.6)",
    textSecondary: "rgba(255,255,255,0.72)",
  },

  accent: {
    brand: "#C8F763",
    shadow: "#9FC132",
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
    navigationPolylineCompleted: "rgba(200, 247, 99, 0.35)",
    navigationPinLabel: "rgba(28, 33, 38, 0.92)",
    frosted: "rgba(28, 33, 38, 0.94)",
    photoScrim: "rgba(0,0,0,0.96)",
    modalScrim: "rgba(0, 0, 0, 0.65)",
    overlayLight: "rgba(15, 17, 20, 0.72)",
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
