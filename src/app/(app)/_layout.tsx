import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { BottomNav } from "@/components/BottomNav";
import { isAuthenticated } from "@/lib/auth";
import { colors } from "@/theme/colors";

export default function AppLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    isAuthenticated().then((authenticated) => {
      if (!authenticated) {
        router.replace("/landing");
        return;
      }
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack
          screenOptions={{
            animation: "none",
            contentStyle: { backgroundColor: colors.brandGray },
            headerShown: false,
          }}
        />
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
