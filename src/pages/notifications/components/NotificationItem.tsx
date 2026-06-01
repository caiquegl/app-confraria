import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { AppNotification } from "../types/notifications.types";

type NotificationItemProps = {
  notification: AppNotification;
  onPress?: (notification: AppNotification) => void;
};

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const isLike =
    notification.type === "post_like" || notification.type === "comment_like";
  const iconName = isLike ? "heart" : "chatbubble";
  const iconBg = isLike ? "#EF4444" : colors.brandPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(notification)}
    >
      {!notification.read && <View style={styles.unreadDot} />}

      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons color="#FFFFFF" name={iconName} size={18} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            numberOfLines={1}
            style={[styles.title, !notification.read && styles.titleUnread]}
          >
            {notification.title}
          </Text>
          <Text style={styles.time}>{notification.time}</Text>
        </View>

        <Text
          numberOfLines={2}
          style={[styles.message, !notification.read && styles.messageUnread]}
        >
          {notification.message}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255)",
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 24,
    borderWidth: 1,
    elevation: 1,
    flexDirection: "row",
    gap: 14,
    padding: 12,
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  headerRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  message: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  messageUnread: {
    
    color: "#4B5563",
    fontWeight: "500",
  },
  time: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  title: {
    color: "#6B7280",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  titleUnread: {
    color: colors.brandDark,
  },
  unreadDot: {
    backgroundColor: colors.brandGreen,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 14,
    top: 14,
    width: 10,
  },
});
