import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EnvironmentBanner, EnvironmentBannerProvider } from "@/components/EnvironmentBanner";
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
  useConfigureVideoCache();

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
