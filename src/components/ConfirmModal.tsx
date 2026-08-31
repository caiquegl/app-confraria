import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState, type ReactNode } from "react";
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

export type ConfirmModalVariant = "default" | "destructive";

export type ConfirmModalProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel: string;
  description: string;
  headerTitle?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  variant?: ConfirmModalVariant;
  visible: boolean;
};

export function ConfirmModal({
  cancelLabel,
  children,
  confirmLabel,
  description,
  headerTitle,
  isLoading = false,
  onClose,
  onConfirm,
  title,
  variant = "default",
  visible,
}: ConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const inFlightRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const isDestructive = variant === "destructive";
  const isBusy = isLoading || isPending;
  const resolvedHeader = headerTitle ?? title;
  const showInnerTitle = Boolean(headerTitle);
  const resolvedCancelLabel = cancelLabel ?? "Cancelar";

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleConfirm = () => {
    if (isBusy || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsPending(true);

    void (async () => {
      try {
        await onConfirm();
      } finally {
        inFlightRef.current = false;
        setIsPending(false);
      }
    })();
  };

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View accessibilityViewIsModal={visible} style={styles.backdropWrap}>
        <Pressable
          accessibilityLabel="Fechar confirmação"
          disabled={isBusy}
          style={styles.backdrop}
          onPress={handleClose}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              {resolvedHeader}
            </Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              accessibilityState={{ disabled: isBusy }}
              disabled={isBusy}
              hitSlop={8}
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons color="#9CA3AF" name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.iconWrap,
                isDestructive ? styles.iconWrapDanger : styles.iconWrapBrand,
              ]}
            >
              {isDestructive ? (
                <Ionicons color="#EF4444" name="warning-outline" size={28} />
              ) : (
                <MaterialCommunityIcons
                  color={colors.brandDark}
                  name="motorbike"
                  size={28}
                />
              )}
            </View>
            {showInnerTitle ? <Text style={styles.title}>{title}</Text> : null}
            <Text style={styles.description}>{description}</Text>
            {children}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isBusy, disabled: isBusy }}
            disabled={isBusy}
            style={[
              styles.primaryButton,
              isDestructive ? styles.primaryButtonDanger : styles.primaryButtonBrand,
              isBusy && styles.buttonDisabled,
            ]}
            onPress={handleConfirm}
          >
            {isBusy ? (
              <ActivityIndicator color={isDestructive ? "#FFFFFF" : colors.brandDark} />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  isDestructive
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
            accessibilityState={{ disabled: isBusy }}
            disabled={isBusy}
            style={styles.secondaryButton}
            onPress={handleClose}
          >
            <Text style={styles.secondaryButtonText}>{resolvedCancelLabel}</Text>
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
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    paddingRight: 12,
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
    minHeight: 44,
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
