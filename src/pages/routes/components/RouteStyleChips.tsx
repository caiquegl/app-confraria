import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

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
              <Ionicons color={colors.brandDark} name="checkmark" size={compact ? 14 : 16} />
            ) : null}
            <Text style={[styles.chipText, compact && styles.chipTextCompact, active && styles.chipTextActive]}>
              {ROUTE_STYLE_LABELS[style]}
            </Text>
            {locked ? (
              <Ionicons color={active ? colors.brandDark : "#9CA3AF"} name="lock-closed" size={11} />
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
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.brandDark,
    fontWeight: "800",
  },
  chipTextCompact: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
