import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

type EventEditUnavailableModalProps = {
  description?: string;
  onClose: () => void;
  title?: string;
  visible: boolean;
};

const DEFAULT_TITLE = "Edição indisponível";
const DEFAULT_DESCRIPTION =
  "Não é possível editar um evento que já ocorreu ou está em andamento.";

export function EventEditUnavailableModal({
  description = DEFAULT_DESCRIPTION,
  onClose,
  title = DEFAULT_TITLE,
  visible,
}: EventEditUnavailableModalProps) {
  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons color="#B45309" name="alert-circle-outline" size={30} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <Button size="lg" style={styles.button} onPress={onClose}>
            Entendi
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
    backgroundColor: "#FEF3C7",
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
