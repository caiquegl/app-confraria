import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InputField } from "@/components/InputField";
import { QUICK_RIDE_FIELD } from "@/pages/quick-rides/lib/quick-ride-form";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type QuickRideCancelModalProps = {
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  otherParticipantsCount: number;
  rideTitle: string;
  visible: boolean;
};

export function QuickRideCancelModal({
  isDeleting,
  onClose,
  onConfirm,
  otherParticipantsCount,
  rideTitle,
  visible,
}: QuickRideCancelModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const participantsLabel =
    otherParticipantsCount === 1
      ? "1 pessoa será avisada"
      : `${otherParticipantsCount} pessoas serão avisadas`;

  const canConfirm = reason.trim().length > 0 && !isDeleting;

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.backdropWrap}>
        <Pressable disabled={isDeleting} style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cancelar rolê</Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              disabled={isDeleting}
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons color={colors.text.muted} name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.alertBox}>
            <View style={styles.alertIconWrap}>
              <Ionicons color={colors.feedback.danger} name="flame-outline" size={20} />
            </View>
            <Text style={styles.alertText}>
              <Text style={styles.alertTextBold}>{participantsLabel}</Text> do cancelamento de
              “{rideTitle}”.
            </Text>
          </View>

          <View style={styles.reasonField}>
            <InputField
              autoCapitalize={QUICK_RIDE_FIELD.cancelReason.autoCapitalize}
              editable={!isDeleting}
              helperText={QUICK_RIDE_FIELD.cancelReason.helperText}
              label={QUICK_RIDE_FIELD.cancelReason.label}
              multiline
              persistentLabel
              placeholder={QUICK_RIDE_FIELD.cancelReason.placeholder}
              required={QUICK_RIDE_FIELD.cancelReason.required}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!canConfirm}
            style={[styles.primaryButton, !canConfirm && styles.buttonDisabled]}
            onPress={() => onConfirm(reason.trim())}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.primaryButtonText}>Cancelar rolê e avisar participantes</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isDeleting}
            style={styles.secondaryButton}
            onPress={handleClose}
          >
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  alertBox: {
    alignItems: "flex-start",
    backgroundColor: colors.surface.dangerSubtle,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    padding: 14,
  },
  alertIconWrap: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  alertText: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  alertTextBold: {
    fontWeight: "900",
  },
  backdrop: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  backdropWrap: {
    backgroundColor: colors.overlay.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  closeButton: {
    alignItems: "center",
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
  },
  reasonField: {
    marginBottom: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.feedback.danger,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginBottom: 8,
    width: "100%",
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: "100%",
  },
  secondaryButtonText: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "800",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: "100%",
  },
});
