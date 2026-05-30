import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.brandGray }}>
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
