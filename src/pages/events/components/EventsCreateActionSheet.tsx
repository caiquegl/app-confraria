import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type EventsCreateActionSheetProps = {
  onClose: () => void;
  onCreateEvent: () => void;
  onCreateQuickRide: () => void;
  visible: boolean;
};

export function EventsCreateActionSheet({
  onClose,
  onCreateEvent,
  onCreateQuickRide,
  visible,
}: EventsCreateActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <Pressable accessibilityRole="button" style={styles.quickRideButton} onPress={onCreateQuickRide}>
            <View style={styles.quickRideIconWrap}>
              <Ionicons color={colors.brandPrimary} name="flame" size={18} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Rolê rápido</Text>
              <Text style={styles.optionDescription}>Chamar a galera pra hoje ou amanhã</Text>
            </View>
          </Pressable>

          <Pressable accessibilityRole="button" style={styles.eventButton} onPress={onCreateEvent}>
            <View style={styles.eventIconWrap}>
              <Ionicons color={colors.brandDark} name="calendar-outline" size={18} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Evento completo</Text>
              <Text style={styles.optionDescription}>
                Criar um evento com data, rota e detalhes
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel="Fechar"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons color="#9CA3AF" name="close" size={20} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "flex-end",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 12,
  },
  eventButton: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventIconWrap: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  optionCopy: {
    flex: 1,
  },
  optionDescription: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  optionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  quickRideButton: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickRideIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.2)",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxWidth: 390,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: "100%",
  },
});
