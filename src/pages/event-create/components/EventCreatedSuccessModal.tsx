import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

type EventCreatedSuccessModalProps = {
  onContinue: () => void;
  visible: boolean;
};

export function EventCreatedSuccessModal({
  onContinue,
  visible,
}: EventCreatedSuccessModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons color={colors.brandDark} name="checkmark" size={30} />
          </View>
          <Text style={styles.title}>Evento criado com sucesso</Text>
          <Text style={styles.description}>
            Seu evento já está salvo e disponível na sua página de eventos.
          </Text>
          <Button size="lg" style={styles.button} onPress={onContinue}>
            Ver meus eventos
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.48)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  button: {
    marginTop: 20,
    width: "100%",
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    width: "100%",
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
});
