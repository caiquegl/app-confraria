import { Redirect, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { BottomNav } from "@/components/BottomNav";
import { getCurrentUserId, isAuthenticated } from "@/lib/auth";
import {
  getStoredCurrentProfile,
  setStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { fetchPublicProfile } from "@/pages/public-profile/services/public-profile.service";
import { colors } from "@/theme/colors";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function AppLayout() {
  const pathname = usePathname();
  const storedProfile = getStoredCurrentProfile();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(storedProfile.avatar);
  const [profileName, setProfileName] = useState<string | null>(storedProfile.name);
  const shouldHideBottomNav =
    pathname.startsWith("/profile/bikes") ||
    pathname.startsWith("/profile/settings") ||
    (pathname.startsWith("/users/") && pathname.includes("/events"));

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setProfileAvatar(profile.avatar);
      setProfileName(profile.name);
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    isAuthenticated().then((authenticated) => {
      if (!mounted) return;
      setAuthState(authenticated ? "authenticated" : "unauthenticated");

      if (authenticated) {
        void getCurrentUserId()
          .then((userId) => {
            if (!userId) return null;
            return fetchPublicProfile(userId);
          })
          .then((profile) => {
            if (!mounted || !profile) return;
            setStoredCurrentProfile({
              avatar: profile.avatar,
              name: profile.name,
            });
          })
          .catch(() => {
            if (!mounted) return;
            setStoredCurrentProfile({ avatar: null, name: null });
          });
      } else {
        setStoredCurrentProfile({ avatar: null, name: null });
      }
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
      {!shouldHideBottomNav && <BottomNav userAvatar={profileAvatar} userName={profileName} />}
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
