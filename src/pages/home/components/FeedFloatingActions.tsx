import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";

import { colors } from "@/theme/colors";

type FeedFloatingActionsProps = {
  hasUnreadNotifications?: boolean;
  isLikedTabActive?: boolean;
  onOpenLiked: () => void;
  onOpenNotifications: () => void;
  onOpenNewPost: () => void;
};

export function FeedFloatingActions({
  hasUnreadNotifications = false,
  isLikedTabActive = false,
  onOpenLiked,
  onOpenNotifications,
  onOpenNewPost,
}: FeedFloatingActionsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabsPillContainer}>
        <View style={styles.tabsPill}>
          <Pressable
            accessibilityLabel="Abrir curtidos"
            accessibilityRole="button"
            accessibilityState={{ selected: isLikedTabActive }}
            style={[styles.tab, isLikedTabActive && styles.tabActive]}
            onPress={onOpenLiked}
          >
            <Ionicons
              color={isLikedTabActive ? colors.brandDark : "#6B7280"}
              name="heart-outline"
              size={18}
            />
          </Pressable>
        </View>
      </View>

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
    alignItems: "flex-end",
    bottom: 18,
    flexDirection: "row",
    gap: 10,
    left: 12,
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
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.brandGreen,
    shadowColor: "#9FC132",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  tabsPill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DADFD5",
    borderRadius: 999,
    borderWidth: 1,
    elevation: 8,
    flex: 1,
    padding: 4,
    shadowColor: colors.brandDark,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    maxWidth: "25%",
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
  tabsPillContainer: {
    flex: 1,
  },
});
