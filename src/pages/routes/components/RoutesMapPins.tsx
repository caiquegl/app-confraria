import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { NearbyCategoryIcon } from "./NearbyCategoryIcon";

export function nearbyPartnerPinColor(category: string): string {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (category.includes("Posto") || category.includes("Gasolina")) return "#F59E0B";
  if (category.includes("Mecân")) return "#7C3AED";
  if (category.includes("Restaur")) return "#F97316";
  if (category.includes("Hot")) return "#0EA5E9";
  return colors.brandPrimary;
}

type NearbyPartnerPinProps = {
  category: string;
};

export function NearbyPartnerPin({ category }: NearbyPartnerPinProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const backgroundColor = nearbyPartnerPinColor(category);

  return (
    <View collapsable={false} style={[styles.partnerPin, { backgroundColor }]}>
      <NearbyCategoryIcon category={category} color={colors.text.inverse} size={14} />
    </View>
  );
}

export function DestinationMapPin() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View collapsable={false} style={styles.destinationPin}>
      <Ionicons color={colors.brandGreen} name="flag" size={15} />
    </View>
  );
}

type StopMapPinProps = {
  index: number;
};

export function StopMapPin({ index }: StopMapPinProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View collapsable={false} style={styles.stopPin}>
      <Text style={styles.stopPinLabel}>{index + 1}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  destinationPin: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    height: 32,
    justifyContent: "center",
    shadowColor: colors.text.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    width: 32,
  },
  partnerPin: {
    alignItems: "center",
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    shadowColor: colors.text.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    width: 28,
  },
  stopPin: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    shadowColor: colors.text.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    width: 24,
  },
  stopPinLabel: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "800",
    includeFontPadding: false,
    textAlign: "center",
  },
});
