import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventAnalyticsHeaderProps = {
  onBack: () => void;
  onDeleteEvent: () => void;
  onEditEvent: () => void;
  topInset: number;
};

export function EventAnalyticsHeader({
  onBack,
  onDeleteEvent,
  onEditEvent,
  topInset,
}: EventAnalyticsHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const closeMenu = () => setMenuVisible(false);

  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <Pressable accessibilityRole="button" style={styles.iconButton} onPress={onBack}>
        <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
      </Pressable>

      <Text style={styles.title}>Gerenciar evento</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mais opções"
        style={styles.iconButton}
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons color={colors.brandDark} name="ellipsis-vertical" size={21} />
      </Pressable>

      <Modal animationType="fade" transparent statusBarTranslucent visible={menuVisible}>
        <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
        <View style={[styles.menu, { top: topInset + 64 }]}>
          <Pressable
            accessibilityRole="button"
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              onEditEvent();
            }}
          >
            <Ionicons color={colors.brandDark} name="pencil-outline" size={17} />
            <Text style={styles.menuItemText}>Editar evento</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              onDeleteEvent();
            }}
          >
            <Ionicons color="#EF4444" name="trash-outline" size={17} />
            <Text style={[styles.menuItemText, styles.menuItemDanger]}>Apagar evento</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  menu: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 8,
    overflow: "hidden",
    position: "absolute",
    right: 24,
    shadowColor: "#000000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    width: 188,
  },
  menuBackdrop: {
    backgroundColor: "rgba(0,0,0,0.04)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  menuDivider: {
    backgroundColor: "#F3F4F6",
    height: 1,
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuItemDanger: {
    color: "#EF4444",
  },
  menuItemText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
});
