import "@/tasks/route-location-tracking.task";

import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EnvironmentBanner, EnvironmentBannerProvider } from "@/components/EnvironmentBanner";
import {
  getRouteBackgroundTrackingSession,
  resumeRouteBackgroundTrackingIfNeeded,
  stopRouteBackgroundTracking,
} from "@/lib/route-background-tracking";
import { routeTrackingLog } from "@/lib/route-tracking-logger";
import { subscribeRouteFinished } from "@/lib/route-navigation-socket";
import { useConfigureVideoCache } from "@/lib/video-cache";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  useConfigureVideoCache();

  useEffect(() => {
    routeTrackingLog.info("RootLayout:resume-tracking-on-mount");
    void resumeRouteBackgroundTrackingIfNeeded();

    const unsubscribe = subscribeRouteFinished(({ routeId }) => {
      void getRouteBackgroundTrackingSession().then((session) => {
        if (session?.routeId === routeId) {
          void stopRouteBackgroundTracking();
        }
      });
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <EnvironmentBannerProvider>
        <SafeAreaView
          edges={["top", "left", "right"]}
          style={{ flex: 1, backgroundColor: colors.brandGray }}
        >
          <EnvironmentBanner />
          <View style={{ flex: 1, overflow: "visible", zIndex: 200 }}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: colors.brandGray },
                headerShown: false,
              }}
            />
          </View>
          <Toast />
        </SafeAreaView>
      </EnvironmentBannerProvider>
    </SafeAreaProvider>
  );
}
