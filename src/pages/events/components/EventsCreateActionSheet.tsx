import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type EventsCreateActionSheetProps = {
  onClose: () => void;
  onCreateEvent: () => void;
  onCreateQuickRide: () => void;
  onOpenMyQuickRides: () => void;
  visible: boolean;
};

export function EventsCreateActionSheet({
  onClose,
  onCreateEvent,
  onCreateQuickRide,
  onOpenMyQuickRides,
  visible,
}: EventsCreateActionSheetProps) {
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
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <View style={styles.handle} />
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons color="#9CA3AF" name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.options}>
            <Pressable
              accessibilityRole="button"
              style={styles.quickRideButton}
              onPress={onCreateQuickRide}
            >
              <View style={styles.quickRideIconWrap}>
                <Ionicons color={colors.brandPrimary} name="flame" size={18} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Rolê rápido</Text>
                <Text style={styles.optionDescription}>Chamar a galera pra hoje ou amanhã</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.optionButton}
              onPress={onOpenMyQuickRides}
            >
              <View style={styles.optionIconWrap}>
                <Ionicons color={colors.brandDark} name="list-outline" size={18} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Meus rolês rápidos</Text>
                <Text style={styles.optionDescription}>
                  Rolês que você criou ou está participando
                </Text>
              </View>
            </Pressable>

            <Pressable accessibilityRole="button" style={styles.optionButton} onPress={onCreateEvent}>
              <View style={styles.optionIconWrap}>
                <Ionicons color={colors.brandDark} name="calendar-outline" size={18} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Evento completo</Text>
                <Text style={styles.optionDescription}>
                  Criar um evento com data, rota e detalhes
                </Text>
              </View>
            </Pressable>
          </View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "flex-end",
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
  handle: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 4,
    width: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerSpacer: {
    height: 40,
    width: 40,
  },
  optionButton: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionCopy: {
    flex: 1,
  },
  optionDescription: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  optionIconWrap: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  optionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  options: {
    gap: 4,
  },
  quickRideButton: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    width: "100%",
  },
});
