import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { colors } from "@/theme/colors";

type FeedFloatingActionsProps = {
  hasUnreadNotifications?: boolean;
  onOpenNotifications: () => void;
  onOpenNewPost: () => void;
};

export function FeedFloatingActions({
  hasUnreadNotifications = false,
  onOpenNotifications,
  onOpenNewPost,
}: FeedFloatingActionsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.75}
        accessibilityLabel="Abrir notificações"
        style={styles.notificationButton}
        onPress={onOpenNotifications}
      >
        <Ionicons color="#6B7280" name="notifications-outline" size={18} />
        {hasUnreadNotifications && <View style={styles.unreadDot} />}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.75}
        accessibilityLabel="Criar nova postagem"
        style={styles.newPostButton}
        onPress={onOpenNewPost}
      >
        <Ionicons color={colors.brandDark} name="add" size={22} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    bottom: 18,
    flexDirection: "row",
    gap: 10,
    position: "absolute",
    right: 12,
    zIndex: 20,
  },
  newPostButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    elevation: 8,
    height: 48,
    justifyContent: "center",
    shadowColor: "#9FC132",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    width: 50,
  },
  notificationButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DADFD5",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 8,
    height: 48,
    justifyContent: "center",
    position: "relative",
    shadowColor: colors.brandDark,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    width: 50,
  },
  unreadDot: {
    backgroundColor: colors.brandGreen,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 12,
    top: 12,
    width: 10,
  },
});
