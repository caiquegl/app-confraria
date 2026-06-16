import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import type * as ExpoNotifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

import { api } from "./api";
import { apiRoutes } from "./api-routes";
import { setHighlightPostId } from "./feed-highlight-store";

const PUSH_TOKEN_KEY = "@confraria/expo_push_token";
const DEFAULT_CHANNEL_ID = "default";

type NotificationsModule = typeof ExpoNotifications;
type NotificationResponse = ExpoNotifications.NotificationResponse;

let notificationHandlerConfigured = false;
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

function isExpoGoAndroid(): boolean {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

function configureNotificationHandler(Notifications: NotificationsModule): void {
  if (notificationHandlerConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isExpoGoAndroid()) {
    return null;
  }

  notificationsModulePromise ??= import("expo-notifications")
    .then((Notifications) => {
      configureNotificationHandler(Notifications);
      return Notifications;
    })
    .catch(() => null);

  return notificationsModulePromise;
}

function getProjectId(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

function getStringDataValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

async function ensureAndroidNotificationChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.MAX,
    name: "Notificação confraria",
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if ((Platform.OS !== "android" && Platform.OS !== "ios") || !Device.isDevice) {
    return null;
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    await ensureAndroidNotificationChannel(Notifications);

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    const finalStatus =
      existingStatus === "granted"
        ? existingStatus
        : (await Notifications.requestPermissionsAsync()).status;

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

    if (storedToken && storedToken !== token) {
      try {
        await api.delete(apiRoutes.notifications.pushToken, { data: { token: storedToken } });
      } catch {
        // Token cleanup is best-effort; the current token still needs to be registered.
      }
    }

    await api.post(apiRoutes.notifications.pushToken, {
      platform: Platform.OS,
      token,
    });
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushNotificationsAsync(): Promise<void> {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;

  try {
    await api.delete(apiRoutes.notifications.pushToken, { data: { token } });
  } catch {
    // Logout should not be blocked if the push token cannot be removed.
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  }
}

function handleNotificationResponse(response: NotificationResponse): void {
  const data = response.notification.request.content.data ?? {};
  const type = getStringDataValue(data.type);
  const conversationId = getStringDataValue(data.conversationId);

  if (type === "chat_message" && conversationId) {
    router.push({
      params: { conversationId },
      pathname: "/messages/[conversationId]",
    });
    return;
  }

  if (type === "event_cancelled") {
    return;
  }

  const eventId = getStringDataValue(data.eventId) ?? getStringDataValue(data.sharedEventId);
  if (eventId) {
    router.push({
      params: { eventId },
      pathname: "/event/[eventId]",
    });
    return;
  }

  const postId = getStringDataValue(data.postId) ?? getStringDataValue(data.sharedPostId);
  if (postId) {
    setHighlightPostId(postId);
    router.push("/feed");
  }
}

export function addNotificationResponseListener(): () => void {
  let active = true;
  let subscription: { remove: () => void } | null = null;

  void getNotificationsModule()
    .then((Notifications) => {
      if (!Notifications || !active) return;

      subscription = Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

      void Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (!response || !active) return;
          handleNotificationResponse(response);
          void Notifications.clearLastNotificationResponseAsync();
        })
        .catch(() => undefined);
    })
    .catch(() => undefined);

  return () => {
    active = false;
    subscription?.remove();
  };
}
