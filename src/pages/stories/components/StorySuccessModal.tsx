import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type StorySuccessModalProps = {
  onClose?: () => void;
  onContinue: () => void;
  visible: boolean;
};

export function StorySuccessModal({
  onClose,
  onContinue,
  visible,
}: StorySuccessModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const handleDismiss = onClose ?? onContinue;

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Fechar modal de story"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
        />

        <View style={styles.card}>
          <Pressable
            accessibilityLabel="Fechar"
            accessibilityRole="button"
            hitSlop={12}
            style={styles.closeButton}
            onPress={handleDismiss}
          >
            <Ionicons color={colors.text.muted} name="close" size={20} />
          </Pressable>

          <View style={styles.iconWrap}>
            <Ionicons color={colors.brandPrimary} name="checkmark-circle" size={56} />
          </View>

          <Text style={styles.title}>Story publicado!</Text>

          <Text style={styles.description}>
            Seu story já está disponível para quem segue você na Confraria.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onContinue}
          >
            <Text style={styles.buttonText}>Continuar</Text>
            <Ionicons color={colors.brandDark} name="chevron-forward" size={20} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    alignItems: "center",
    backgroundColor: colors.overlay.scrimMedium,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accent.brand,
    borderRadius: 16,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.text.onBrand,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: 32,
    paddingHorizontal: 32,
    paddingVertical: 32,
    position: "relative" as const,
    width: "100%",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    position: "absolute" as const,
    right: 16,
    top: 16,
    width: 36,
    zIndex: 2,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: "center",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface.brandSubtle,
    borderRadius: 999,
    height: 88,
    justifyContent: "center",
    marginBottom: 20,
    width: 88,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
});
