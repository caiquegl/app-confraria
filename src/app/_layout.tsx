import "@/lib/sentry-init";

import { Stack, usePathname } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { colors } from "@/theme/colors";

// Task de background + AsyncStorage/Sentry não rodam no SSR web do `eas update`.
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/tasks/route-location-tracking.task");
}

if (__DEV__) {
  // Deixei esses imports com a verificação desativado para não dar erro no dev para que o reactotron seja carregado apenas em desenvolvimento

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/reactotron");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/reactotron-axios").setupReactotronAxios();
}

export default function RootLayout() {
  const pathname = usePathname();

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
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppKeyboardProvider>
          <EnvironmentBannerProvider>
            <SafeAreaView
              edges={["top", "left", "right"]}
              style={styles.safeArea}
            >
              <EnvironmentBanner />
              <View style={styles.stackWrap}>
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: colors.brandGray },
                    headerShown: false,
                  }}
                />
              </View>
            </SafeAreaView>
            <AppToastHost />
          </EnvironmentBannerProvider>
        </AppKeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppKeyboardProvider({ children }: { children: ReactNode }) {
  if (Platform.OS === "web") {
    return children;
  }

  return <KeyboardProvider>{children}</KeyboardProvider>;
}

function AppToastHost() {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={styles.toastHost}>
      <Toast position="top" topOffset={Math.max(insets.top, 12) + 8} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  stackWrap: {
    flex: 1,
    overflow: "visible",
  },
  // Só no topo: absoluteFill + elevation alto bloqueava toques no app inteiro (ex.: finalizar rota).
  toastHost: {
    elevation: 10000,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10000,
  },
});
