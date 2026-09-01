import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type QuickRideDetailHostMenuProps = {
  onCancelRide: () => void;
  onEditRide: () => void;
  otherParticipantsCount: number;
  topInset: number;
};

export function QuickRideDetailHostMenu({
  onCancelRide,
  onEditRide,
  otherParticipantsCount,
  topInset,
}: QuickRideDetailHostMenuProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [menuVisible, setMenuVisible] = useState(false);
  const hasOtherParticipants = otherParticipantsCount > 0;

  const closeMenu = () => setMenuVisible(false);

  return (
    <>
      <Pressable
        accessibilityLabel="Mais opções"
        accessibilityRole="button"
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons color={colors.brandDark} name="ellipsis-vertical" size={21} />
      </Pressable>

      <Modal animationType="fade" transparent statusBarTranslucent visible={menuVisible}>
        <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
        <View style={[styles.menu, { top: topInset + 56 }]}>
          <Pressable
            accessibilityRole="button"
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              onEditRide();
            }}
          >
            <Ionicons color={colors.brandDark} name="pencil-outline" size={17} />
            <Text style={styles.menuItemText}>Editar rolê</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              onCancelRide();
            }}
          >
            <Ionicons
              color={colors.feedback.danger}
              name={hasOtherParticipants ? "flame-outline" : "trash-outline"}
              size={17}
            />
            <Text style={[styles.menuItemText, styles.menuItemDanger]}>
              {hasOtherParticipants ? "Cancelar rolê" : "Apagar rolê"}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: AppColors) => ({
  menu: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 8,
    overflow: "hidden",
    position: "absolute",
    right: 16,
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
});
