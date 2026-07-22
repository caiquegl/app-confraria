import "@/lib/sentry-init";
import "@/tasks/route-location-tracking.task";

import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
import { addSentryBreadcrumb } from "@/lib/sentry";
import { useConfigureVideoCache } from "@/lib/video-cache";
import { colors } from "@/theme/colors";

if (__DEV__) {
  // Deixei esses imports com a verificação desativado para não dar erro no dev para que o reactotron seja carregado apenas em desenvolvimento

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/reactotron");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/reactotron-axios").setupReactotronAxios();
}

export default function RootLayout() {
  const pathname = usePathname();
  useConfigureVideoCache();

  useEffect(() => {
    if (!pathname) return;
    addSentryBreadcrumb("navigation", { pathname });
  }, [pathname]);

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

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
