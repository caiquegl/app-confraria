import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventAnalyticsHeaderProps = {
  onBack: () => void;
  onDeleteEvent: () => void;
  onEditEvent: () => void;
  participantsCount: number;
};

export function EventAnalyticsHeader({
  onBack,
  onDeleteEvent,
  onEditEvent,
  participantsCount,
}: EventAnalyticsHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [menuVisible, setMenuVisible] = useState(false);
  const hasRegistrants = participantsCount > 0;

  const closeMenu = () => setMenuVisible(false);

  return (
    <View style={styles.header}>
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
        <View style={[styles.menu, { top: 60 }]}>
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
            <Ionicons
              color={colors.feedback.danger}
              name={hasRegistrants ? "calendar-outline" : "trash-outline"}
              size={17}
            />
            <Text style={[styles.menuItemText, styles.menuItemDanger]}>
              {hasRegistrants ? "Cancelar evento" : "Apagar evento"}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  menu: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 8,
    overflow: "hidden",
    position: "absolute",
    right: 24,
    shadowColor: colors.surface.video,
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
    backgroundColor: colors.surface.subtle,
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
    color: colors.feedback.danger,
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
