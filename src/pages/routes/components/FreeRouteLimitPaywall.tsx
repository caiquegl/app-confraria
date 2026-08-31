import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

type FreeRouteLimitPaywallProps = {
  description?: string;
  onClose: () => void;
  onSubscribe: () => void;
  title?: string;
  visible: boolean;
};

export function FreeRouteLimitPaywall({
  description = "No plano gratuito você pode salvar até 5 roteiros privados. Assine o Premium para salvar rotas ilimitadas.",
  onClose,
  onSubscribe,
  title = "Limite de rotas salvas",
  visible,
}: FreeRouteLimitPaywallProps) {
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
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <Ionicons color={colors.brandDark} name="lock-closed" size={28} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <Button size="lg" style={styles.primaryButton} onPress={onSubscribe}>
            Assinar Premium
          </Button>

          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backdropWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  iconWrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    marginBottom: 16,
    width: 64,
  },
  primaryButton: {
    marginTop: 24,
    width: "100%",
  },
  secondaryButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
});
