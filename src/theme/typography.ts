import type { TextStyle } from "react-native";

/**
 * Presets tipográficos por papel visual.
 * Espalhe com `[typography.body, { color: colors.text.secondary }]` quando precisar sobrescrever cor.
 */
export const typography = {
  caption: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  body: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  bodyStrong: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  input: {
    fontSize: 15,
    fontWeight: "400",
  },
  buttonSm: {
    fontSize: 13,
    fontWeight: "600",
  },
  buttonMd: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonLg: {
    fontSize: 16,
    fontWeight: "600",
  },
  titleSection: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  titlePage: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  titlePageLarge: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  meta: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
  micro: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 14,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
} as const satisfies Record<string, TextStyle>;
