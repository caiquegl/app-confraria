import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventMetricCardProps = {
  children?: ReactNode;
  delta?: string;
  icon: ReactNode;
  label: string;
  value: string;
};

export function EventMetricCard({
  children,
  delta,
  icon,
  label,
  value,
}: EventMetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={styles.iconBox}>{icon}</View>
          <Text style={styles.label}>{label}</Text>
        </View>
        {delta ? (
          <View style={styles.deltaBadge}>
            <Text style={styles.deltaText}>{delta}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  deltaBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deltaText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "900",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  label: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  value: {
    color: colors.brandDark,
    fontSize: 30,
    fontWeight: "900",
  },
});
