import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { BottomNav } from "@/components/BottomNav";
import { isAuthenticated } from "@/lib/auth";
import { colors } from "@/theme/colors";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function AppLayout() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let mounted = true;

    isAuthenticated().then((authenticated) => {
      if (!mounted) return;
      setAuthState(authenticated ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (authState === "loading") return null;

  if (authState === "unauthenticated") {
    return <Redirect href="/landing" />;
  }

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
