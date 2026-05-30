import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Logo } from "@/components/Logo";
import { colors } from "@/theme/colors";

import type { WelcomeModalProps } from "../types/landing.types";

export function WelcomeModal({ onContinue, visible }: WelcomeModalProps) {
  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Logo width={96} height={64} />

          <Text style={styles.title}>{"Bem-vindo ao\nConfraria"}</Text>

          <Text style={styles.description}>
            O 1º app que conecta você aos melhores eventos e encontros de
            motociclismo no Brasil.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onContinue}
          >
            <Text style={styles.buttonText}>Vamos lá!</Text>
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
    backgroundColor: "rgba(0,0,0,0.10)",
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
    backgroundColor: "#ffffff",
    borderRadius: 32,
    gap: 0,
    paddingHorizontal: 32,
    paddingVertical: 32,
    width: "100%",
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: 16,
    marginTop: 24,
    textAlign: "center",
  },
});
