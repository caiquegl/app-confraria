import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { NAV_CONTROL_BUTTON_SIZE } from "./route-navigation-controls.constants";

import type { RouteNavigationState } from "../hooks/useRouteNavigation";

type RouteNavigationStatsCardProps = {
  canFinish: boolean;
  isOffRoute?: boolean;
  onRecalculate?: () => void;
  onStop: () => void;
  state: Pick<
    RouteNavigationState,
    | "etaLabel"
    | "isRerouting"
    | "remainingDistanceLabel"
    | "remainingDurationLabel"
    | "rerouteFailed"
    | "speedLabel"
  >;
};

export function RouteNavigationStatsCard({
  canFinish,
  isOffRoute = false,
  onRecalculate,
  onStop,
  state,
}: RouteNavigationStatsCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const showRecalculate =
    Boolean(onRecalculate) &&
    !state.isRerouting &&
    (state.rerouteFailed || isOffRoute);

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.duration}>{state.remainingDurationLabel}</Text>
        <View style={styles.metaRow}>
          {state.isRerouting ? (
            <Text style={styles.offRouteMeta}>Recalculando rota...</Text>
          ) : state.rerouteFailed ? (
            <Text style={styles.offRouteMeta}>Falha ao recalcular</Text>
          ) : isOffRoute ? (
            <Text style={styles.offRouteMeta}>Fora da rota</Text>
          ) : (
            <>
              <Text style={styles.meta}>{state.remainingDistanceLabel}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.meta}>Chegada {state.etaLabel}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.meta}>{state.speedLabel}</Text>
            </>
          )}
        </View>
        {showRecalculate ? (
          <Pressable
            accessibilityLabel="Recalcular agora"
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.recalculateButton, pressed && styles.pressed]}
            onPress={onRecalculate}
          >
            <Ionicons color={colors.brandDark} name="refresh" size={14} />
            <Text style={styles.recalculateText}>Recalcular agora</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel={canFinish ? "Finalizar passeio" : "Sair da navegação"}
        accessibilityRole="button"
        accessibilityState={{ disabled: false }}
        hitSlop={8}
        style={[styles.stopButton, !canFinish && styles.stopButtonDisabled]}
        onPress={onStop}
      >
        <Ionicons color={colors.text.inverse} name={canFinish ? "stop-circle" : "exit-outline"} size={22} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  card: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderRadius: 24,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: colors.surface.video,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  copy: {
    flex: 1,
  },
  dot: {
    color: colors.text.secondary,
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
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  offRouteMeta: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  recalculateButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accent.brand,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recalculateText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: colors.feedback.danger,
    borderRadius: 18,
    height: NAV_CONTROL_BUTTON_SIZE,
    justifyContent: "center",
    shadowColor: colors.feedback.danger,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    width: NAV_CONTROL_BUTTON_SIZE,
  },
  stopButtonDisabled: {
    backgroundColor: colors.text.secondary,
    shadowColor: colors.text.secondary,
    shadowOpacity: 0.2,
  },
});
