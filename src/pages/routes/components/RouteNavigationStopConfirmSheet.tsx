import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { formatRouteDistance, formatRouteDuration } from "../utils/route-format.utils";

type RouteNavigationStopConfirmSheetProps = {
  destinationLabel: string;
  isFinishing: boolean;
  onClose: () => void;
  onConfirm: () => void;
  routeTitle: string;
  traveledDistanceMeters: number;
  tripDurationSeconds: number;
  visible: boolean;
};

export function RouteNavigationStopConfirmSheet({
  destinationLabel,
  isFinishing,
  onClose,
  onConfirm,
  routeTitle,
  traveledDistanceMeters,
  tripDurationSeconds,
  visible,
}: RouteNavigationStopConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <Pressable style={styles.backdrop} onPress={isFinishing ? undefined : onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 18 }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons color="#EF4444" name="stop-circle" size={28} />
          </View>
          <Pressable
            disabled={isFinishing}
            hitSlop={8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons color="#9CA3AF" name="close" size={20} />
          </Pressable>
        </View>

        <Text style={styles.title}>Finalizar passeio?</Text>
        <Text style={styles.subtitle}>
          A navegação será encerrada e o passeio marcado como concluído.
        </Text>

        <View style={styles.summaryCard}>
          <Text numberOfLines={2} style={styles.routeTitle}>
            {routeTitle}
          </Text>

          <View style={styles.summaryRows}>
            <InfoRow icon="flag-outline" text={destinationLabel || "Destino"} />
            <InfoRow
              icon="time-outline"
              strong
              text={`Tempo de passeio: ${formatRouteDuration(tripDurationSeconds)}`}
            />
            <InfoRow
              icon="navigate-outline"
              text={`Percorrido: ${formatRouteDistance(traveledDistanceMeters)}`}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isFinishing}
          style={[styles.confirmButton, isFinishing && styles.confirmButtonDisabled]}
          onPress={onConfirm}
        >
          {isFinishing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Finalizar passeio</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isFinishing}
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Continuar navegando</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function InfoRow({
  icon,
  strong = false,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  strong?: boolean;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons color="#9CA3AF" name={icon} size={16} />
      <Text numberOfLines={2} style={[styles.infoText, strong && styles.infoTextStrong]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 0,
    width: 40,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.75,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#D1D5DB",
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 44,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
    minHeight: 40,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  infoText: {
    color: "#6B7280",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  infoTextStrong: {
    color: colors.brandDark,
    fontWeight: "800",
  },
  routeTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    position: "absolute",
    right: 0,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: colors.brandGray,
    borderRadius: 22,
    marginBottom: 20,
    padding: 16,
  },
  summaryRows: {
    gap: 10,
  },
  title: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
});
