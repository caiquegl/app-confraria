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

import { colors, radii, spacing, typography } from "@/theme";

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
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing["4xl"] }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              {resolvedHeader}
            </Text>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              accessibilityState={{ disabled: isBusy }}
              disabled={isBusy}
              hitSlop={spacing.md}
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons color={colors.text.muted} name="close" size={20} />
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
                <Ionicons color={colors.feedback.danger} name="warning-outline" size={28} />
              ) : (
                <MaterialCommunityIcons
                  color={colors.text.primary}
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
              <ActivityIndicator
                color={isDestructive ? colors.feedback.dangerForeground : colors.text.primary}
              />
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
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: {
    alignItems: "center",
    marginBottom: spacing["3xl"],
    paddingHorizontal: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing["3xl"],
  },
  headerTitle: {
    color: colors.text.primary,
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    paddingRight: spacing.lg,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing["2xl"],
    width: 56,
  },
  iconWrapBrand: {
    backgroundColor: colors.accent.brand,
  },
  iconWrapDanger: {
    backgroundColor: colors.surface.dangerSubtle,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: "100%",
  },
  primaryButtonBrand: {
    backgroundColor: colors.accent.brand,
  },
  primaryButtonDanger: {
    backgroundColor: colors.feedback.danger,
  },
  primaryButtonText: {
    fontSize: typography.input.fontSize,
    fontWeight: "800",
  },
  primaryButtonTextBrand: {
    color: colors.text.primary,
  },
  primaryButtonTextDanger: {
    color: colors.feedback.dangerForeground,
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
    color: colors.text.primary,
    fontSize: typography.input.fontSize,
    fontWeight: "800",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing["4xl"],
    paddingTop: spacing["4xl"],
    width: "100%",
  },
  title: {
    color: colors.text.primary,
    fontSize: spacing["2xl"],
    fontWeight: "900",
    textAlign: "center",
  },
});
