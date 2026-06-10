import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type EventParticipationConfirmSheetProps = {
  dateLabel: string;
  isConfirming: boolean;
  locationLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  timeLabel: string;
  title: string;
  visible: boolean;
};

export function EventParticipationConfirmSheet({
  dateLabel,
  isConfirming,
  locationLabel,
  onClose,
  onConfirm,
  timeLabel,
  title,
  visible,
}: EventParticipationConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" transparent statusBarTranslucent visible={visible}>
      <Pressable style={styles.backdrop} onPress={isConfirming ? undefined : onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 18 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirmar presença</Text>
          <Pressable
            disabled={isConfirming}
            hitSlop={8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons color="#9CA3AF" name="close" size={20} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text numberOfLines={2} style={styles.eventTitle}>
            {title}
          </Text>

          <View style={styles.summaryRows}>
            <InfoRow
              icon="calendar-outline"
              text={`${dateLabel}${timeLabel ? ` · ${timeLabel}` : ""}`}
            />
            <InfoRow icon="location-outline" text={locationLabel || "Local a definir"} />
            <InfoRow icon="people-outline" text="Gratuito" strong />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isConfirming}
          style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
          onPress={onConfirm}
        >
          {isConfirming ? (
            <ActivityIndicator color={colors.brandDark} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar presença</Text>
          )}
        </Pressable>

        <Text style={styles.note}>Você pode cancelar a qualquer momento antes do evento</Text>
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
      <Text
        numberOfLines={2}
        style={[styles.infoText, strong && styles.infoTextStrong]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.5)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
  eventTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
  note: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 22,
    position: "absolute",
    right: 0,
  },
  summaryCard: {
    borderColor: "#E5E7EB",
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  summaryRows: {
    gap: 9,
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
  },
});
