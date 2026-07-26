import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

type SubscriptionConfirmModalProps = {
  confirmLabel: string;
  description: string;
  headerTitle: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  variant?: "brand" | "danger";
  visible: boolean;
};

export function SubscriptionConfirmModal({
  confirmLabel,
  description,
  headerTitle,
  isLoading = false,
  onClose,
  onConfirm,
  title,
  variant = "brand",
  visible,
}: SubscriptionConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const isDanger = variant === "danger";

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdropWrap}>
        <Pressable disabled={isLoading} style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              disabled={isLoading}
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons color="#9CA3AF" name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.iconWrap,
                isDanger ? styles.iconWrapDanger : styles.iconWrapBrand,
              ]}
            >
              {isDanger ? (
                <Ionicons color="#EF4444" name="close-circle-outline" size={28} />
              ) : (
                <MaterialCommunityIcons
                  color={colors.brandDark}
                  name="motorbike"
                  size={28}
                />
              )}
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            style={[
              styles.primaryButton,
              isDanger ? styles.primaryButtonDanger : styles.primaryButtonBrand,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={onConfirm}
          >
            {isLoading ? (
              <ActivityIndicator color={isDanger ? "#FFFFFF" : colors.brandDark} />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  isDanger
                    ? styles.primaryButtonTextDanger
                    : styles.primaryButtonTextBrand,
                ]}
              >
                {confirmLabel}
              </Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            style={styles.secondaryButton}
            onPress={onClose}
          >
            <Text style={styles.secondaryButtonText}>
              {isDanger ? "Manter" : "Cancelar"}
            </Text>
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
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: 16,
    width: 56,
  },
  iconWrapBrand: {
    backgroundColor: colors.brandGreen,
  },
  iconWrapDanger: {
    backgroundColor: "#FEF2F2",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginBottom: 8,
    width: "100%",
  },
  primaryButtonBrand: {
    backgroundColor: colors.brandGreen,
  },
  primaryButtonDanger: {
    backgroundColor: "#EF4444",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButtonTextBrand: {
    color: colors.brandDark,
  },
  primaryButtonTextDanger: {
    color: "#FFFFFF",
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
