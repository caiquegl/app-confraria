import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { AppNotification } from "../types/notifications.types";
import { NotificationItem } from "./NotificationItem";

type NotificationsListProps = {
  newNotifications: AppNotification[];
  oldNotifications: AppNotification[];
  onPressNotification?: (notification: AppNotification) => void;
};

export function NotificationsList({
  newNotifications,
  oldNotifications,
  onPressNotification,
}: NotificationsListProps) {
  const isEmpty = newNotifications.length === 0 && oldNotifications.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons color="#9CA3AF" name="notifications-outline" size={28} />
        </View>
        <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {newNotifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Novas</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{newNotifications.length}</Text>
            </View>
          </View>

          <View style={styles.list}>
            {newNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={onPressNotification}
              />
            ))}
          </View>
        </View>
      )}

      {oldNotifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Anteriores</Text>
          </View>

          <View style={styles.list}>
            {oldNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={onPressNotification}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: "800",
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  empty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    opacity: 0.6,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 16,
    height: 64,
    justifyContent: "center",
    marginBottom: 16,
    width: 64,
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    gap: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
});
