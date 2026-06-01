import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type StorySuccessModalProps = {
  visible: boolean;
  onContinue: () => void;
};

export function StorySuccessModal({
  visible,
  onContinue,
}: StorySuccessModalProps) {
  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={colors.brandPrimary} />
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
            <Ionicons name="chevron-forward" size={20} color={colors.brandDark} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
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
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingHorizontal: 32,
    paddingVertical: 32,
    width: "100%",
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: "center",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#EEF3E2",
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
