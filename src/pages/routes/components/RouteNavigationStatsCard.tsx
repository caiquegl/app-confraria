import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { RouteNavigationState } from "../hooks/useRouteNavigation";

type RouteNavigationStatsCardProps = {
  canFinish: boolean;
  onStop: () => void;
  state: Pick<
    RouteNavigationState,
    "etaLabel" | "remainingDistanceLabel" | "remainingDurationLabel"
  >;
};

export function RouteNavigationStatsCard({ canFinish, onStop, state }: RouteNavigationStatsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.duration}>{state.remainingDurationLabel}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{state.remainingDistanceLabel}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>Chegada {state.etaLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canFinish }}
        style={[styles.stopButton, !canFinish && styles.stopButtonDisabled]}
        onPress={onStop}
      >
        <Ionicons color="#FFFFFF" name={canFinish ? "stop-circle" : "exit-outline"} size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderRadius: 24,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  copy: {
    flex: 1,
  },
  dot: {
    color: "#6B7280",
    fontSize: 12,
  },
  duration: {
    color: colors.brandGreen,
    fontFamily: "monospace",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  meta: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    width: 52,
  },
  stopButtonDisabled: {
    backgroundColor: "#6B7280",
    shadowColor: "#6B7280",
    shadowOpacity: 0.2,
  },
});
