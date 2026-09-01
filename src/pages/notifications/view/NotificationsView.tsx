import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { ErrorState } from "@/components/ErrorState";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { useNotifications } from "../business/useNotifications";
import { NotificationsList } from "../components/NotificationsList";
import type { NotificationsViewProps } from "../types/notifications.types";

export function NotificationsView({
  onBack,
  onOpenEvent,
  onOpenPost,
  onOpenQuickRide,
}: NotificationsViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { error, isLoading, isRetrying, newNotifications, oldNotifications, reload } =
    useNotifications();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Text style={styles.title}>Notificações</Text>

        <Pressable
          accessibilityLabel="Fechar notificações"
          hitSlop={8}
          style={styles.closeButton}
          onPress={onBack}
        >
          <Ionicons color={colors.text.secondary} name="close" size={18} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : error ? (
          <ErrorState
            description="Verifique a conexão e tente novamente. Isso não significa que você não tem notificações."
            layout="inline"
            retrying={isRetrying}
            style={styles.errorState}
            title="Não foi possível carregar as notificações"
            onRetry={() => void reload()}
          />
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

              if (notification.type === "quick_ride_cancelled") {
                Toast.show({
                  type: "info",
                  text1: "Este rolê foi cancelado",
                });
                return;
              }

              if (notification.quickRideId) {
                onOpenQuickRide(notification.quickRideId);
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

const createStyles = (colors: AppColors) => ({
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
  errorState: {
    flex: 1,
    justifyContent: "center",
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
