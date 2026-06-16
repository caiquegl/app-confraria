import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { colors } from "@/theme/colors";

import { useNotifications } from "../business/useNotifications";
import { NotificationsList } from "../components/NotificationsList";
import type { NotificationsViewProps } from "../types/notifications.types";

export function NotificationsView({ onBack, onOpenEvent, onOpenPost }: NotificationsViewProps) {
  const insets = useSafeAreaInsets();
  const { error, isLoading, newNotifications, oldNotifications } = useNotifications();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Notificações</Text>

        <Pressable
          accessibilityLabel="Fechar notificações"
          hitSlop={8}
          style={styles.closeButton}
          onPress={onBack}
        >
          <Ionicons color="#6B7280" name="close" size={18} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <NotificationsList
            newNotifications={newNotifications}
            oldNotifications={oldNotifications}
            onPressNotification={(notification) => {
              if (notification.type === "event_cancelled") {
                Toast.show({
                  type: "info",
                  text1: "Este evento foi cancelado",
                });
                return;
              }

              if (notification.eventId) {
                onOpenEvent(notification.eventId);
                return;
              }

              if (notification.postId) onOpenPost(notification.postId);
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: "rgba(229,231,235,0.7)",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderBottomColor: "rgba(229,231,235,0.8)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
});
