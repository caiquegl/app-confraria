import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type QuickRideDeleteConfirmModalProps = {
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rideTitle: string;
  visible: boolean;
};

export function QuickRideDeleteConfirmModal({
  isDeleting,
  onClose,
  onConfirm,
  rideTitle,
  visible,
}: QuickRideDeleteConfirmModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdropWrap}>
        <Pressable disabled={isDeleting} style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Apagar rolê</Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              disabled={isDeleting}
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons color="#9CA3AF" name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons color="#EF4444" name="trash-outline" size={28} />
            </View>
            <Text style={styles.title}>Tem certeza que quer apagar “{rideTitle}”?</Text>
            <Text style={styles.description}>
              Essa ação não pode ser desfeita. O rolê sai do ar e deixa de aparecer nas listas.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isDeleting}
            style={[styles.primaryButton, isDeleting && styles.buttonDisabled]}
            onPress={onConfirm}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Apagar rolê</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isDeleting}
            style={styles.secondaryButton}
            onPress={onClose}
          >
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    opacity: 0.7,
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
  content: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
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
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: 16,
    width: 56,
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
    fontSize: 15,
    fontWeight: "800",
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
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
});
