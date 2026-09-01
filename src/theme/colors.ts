/**
 * Cores de marca e tokens semânticos do Confraria.
 *
 * Preferir papéis semânticos (`text.secondary`, `border.subtle`) em código novo.
 * Aliases de marca (`brandGreen`, `brandDark`, etc.) permanecem para compatibilidade.
 */
export const colors = {
  brandGreen: "#C8F763",
  brandDark: "#1C2126",
  brandGray: "#F5F7F5",
  brandPrimary: "#576D1E",

  text: {
    primary: "#1C2126",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    placeholder: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  surface: {
    primary: "#FFFFFF",
    subtle: "#F3F4F6",
    disabled: "#F9FAFB",
    canvas: "#F5F7F5",
    dangerSubtle: "#FEF2F2",
  },

  border: {
    subtle: "#E5E7EB",
    default: "#D1D5DB",
  },

  feedback: {
    danger: "#EF4444",
    dangerForeground: "#FFFFFF",
  },

  accent: {
    brand: "#C8F763",
  },
} as const;
