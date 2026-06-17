import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

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
              <Ionicons color="#9CA3AF" name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.alertBox}>
            <View style={styles.alertIconWrap}>
              <Ionicons color="#EF4444" name="flame-outline" size={20} />
            </View>
            <Text style={styles.alertText}>
              <Text style={styles.alertTextBold}>{participantsLabel}</Text> do cancelamento de
              “{rideTitle}”.
            </Text>
          </View>

          <Text style={styles.label}>Motivo do cancelamento</Text>
          <TextInput
            editable={!isDeleting}
            multiline
            placeholder="Ex.: choveu forte, vamos remarcar para outro dia."
            placeholderTextColor="#9CA3AF"
            style={styles.textarea}
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />

          <Pressable
            accessibilityRole="button"
            disabled={!canConfirm}
            style={[styles.primaryButton, !canConfirm && styles.buttonDisabled]}
            onPress={() => onConfirm(reason.trim())}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
  alertBox: {
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  buttonDisabled: {
    opacity: 0.5,
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
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginBottom: 8,
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
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
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxWidth: 390,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: "100%",
  },
  textarea: {
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
