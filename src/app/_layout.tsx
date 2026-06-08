import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import { useConfigureVideoCache } from "@/lib/video-cache";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  useConfigureVideoCache();

  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: colors.brandGray }}
      >
        <EnvironmentBanner />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.brandGray },
            headerShown: false,
          }}
        />
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
