import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

import {
  isPremiumRouteStyle,
  ROUTE_STYLE_LABELS,
  ROUTE_STYLES,
  type RouteStyle,
} from "../types/route-style";

type RouteStyleChipsProps = {
  compact?: boolean;
  isPremium: boolean;
  onRequestPremium: () => void;
  onSelect: (style: RouteStyle) => void;
  value: RouteStyle;
};

export function RouteStyleChips({
  compact = false,
  isPremium,
  onRequestPremium,
  onSelect,
  value,
}: RouteStyleChipsProps) {
  const handleSelect = (style: RouteStyle) => {
    if (style === value) return;

    if (isPremiumRouteStyle(style) && !isPremium) {
      onRequestPremium();
      return;
    }

    onSelect(style);
  };

  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {ROUTE_STYLES.map((style) => {
        const active = value === style;
        const locked = isPremiumRouteStyle(style) && !isPremium;

        return (
          <Pressable
            key={style}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              active && styles.chipActive,
            ]}
            onPress={() => handleSelect(style)}
          >
            {active ? (
              <Ionicons color={colors.text.primary} name="checkmark" size={compact ? 14 : 16} />
            ) : null}
            <Text style={[styles.chipText, compact && styles.chipTextCompact, active && styles.chipTextActive]}>
              {ROUTE_STYLE_LABELS[style]}
            </Text>
            {locked ? (
              <Ionicons
                color={active ? colors.text.primary : colors.text.muted}
                name="lock-closed"
                size={11}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.accent.brand,
    borderColor: colors.accent.brand,
  },
  chipCompact: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipText: {
    ...typography.buttonSm,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.primary,
    fontWeight: "800",
  },
  chipTextCompact: {
    fontSize: typography.caption.fontSize,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
