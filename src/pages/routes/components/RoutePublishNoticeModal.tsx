import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

type RoutePublishNoticeModalProps = {
  mode: "published" | "unpublished" | null;
  onContinue: () => void;
  visible: boolean;
};

export function RoutePublishNoticeModal({
  mode,
  onContinue,
  visible,
}: RoutePublishNoticeModalProps) {
  if (!mode) return null;

  const isPublished = mode === "published";

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconWrap,
              isPublished ? styles.iconWrapPublished : styles.iconWrapUnpublished,
            ]}
          >
            <Ionicons
              color={isPublished ? "#FFFFFF" : "#EF4444"}
              name="globe-outline"
              size={30}
            />
          </View>

          <Text style={styles.title}>
            {isPublished ? "Rota publicada!" : "Rota despublicada"}
          </Text>

          <Text style={styles.description}>
            {isPublished
              ? "Sua rota já está disponível para outros membros da Confraria."
              : "Sua rota deixou de aparecer para outros membros da Confraria."}
          </Text>

          <Button size="lg" style={styles.button} onPress={onContinue}>
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
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  iconWrapPublished: {
    backgroundColor: colors.brandGreen,
  },
  iconWrapUnpublished: {
    backgroundColor: "#FEE2E2",
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
});
