import { Redirect, Stack, usePathname, router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { BottomNav } from "@/components/BottomNav";
import { getCurrentUserId, isAuthenticated } from "@/lib/auth";
import {
  getStoredCurrentProfile,
  setStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { prefetchGeolocation } from "@/lib/location";
import {
  addNotificationResponseListener,
  registerForPushNotificationsAsync,
} from "@/lib/push-notifications";
import { getRouteBackgroundTrackingSession } from "@/lib/route-background-tracking";
import { fetchPublicProfile } from "@/pages/public-profile/services/public-profile.service";
import { ActiveRouteFAB } from "@/pages/routes/components/ActiveRouteFAB";
import {
  getActiveNavigationRouteId,
  setActiveNavigationRouteId,
  subscribeActiveNavigation,
} from "@/pages/routes/stores/active-navigation-store";
import { colors } from "@/theme/colors";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function AppLayout() {
  const pathname = usePathname() ?? "";
  const storedProfile = getStoredCurrentProfile();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(storedProfile.avatar);
  const [profileName, setProfileName] = useState<string | null>(storedProfile.name);
  const [activeNavigationRouteId, setActiveNavigationRouteIdState] = useState<string | null>(
    getActiveNavigationRouteId(),
  );
  const isOnNavigationScreen = /\/routes\/[^/]+\/navigate/.test(pathname);
  const shouldHideBottomNav =
    pathname.startsWith("/event/") ||
    pathname.startsWith("/events/discover") ||
    pathname.startsWith("/profile/bikes") ||
    pathname.startsWith("/profile/favorites") ||
    pathname.startsWith("/profile/settings") ||
    pathname.startsWith("/quick-rides/") ||
    pathname.startsWith("/routes/create") ||
    isOnNavigationScreen ||
    (pathname.startsWith("/users/") && pathname.includes("/events"));
  const showActiveRouteFab =
    authState === "authenticated" &&
    activeNavigationRouteId != null &&
    !isOnNavigationScreen;

  useEffect(() => {
    if (authState !== "authenticated") return;

    void prefetchGeolocation();
  }, [authState]);

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setProfileAvatar(profile.avatar);
      setProfileName(profile.name);
    });
  }, []);

  useEffect(() => {
    return subscribeActiveNavigation(setActiveNavigationRouteIdState);
  }, []);

  useEffect(() => {
    if (authState !== "authenticated") return;

    let mounted = true;

    void getRouteBackgroundTrackingSession().then((session) => {
      if (!mounted || !session?.routeId) return;
      if (getActiveNavigationRouteId()) return;
      setActiveNavigationRouteId(session.routeId);
    });

    return () => {
      mounted = false;
    };
  }, [authState]);

  useEffect(() => {
    let mounted = true;

    isAuthenticated().then((authenticated) => {
      if (!mounted) return;
      setAuthState(authenticated ? "authenticated" : "unauthenticated");

      if (authenticated) {
        void registerForPushNotificationsAsync();

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
        setActiveNavigationRouteId(null);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (authState !== "authenticated") return;

    return addNotificationResponseListener();
  }, [authState]);

  if (authState === "loading") {
    return <View style={styles.container} />;
  }

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
      {showActiveRouteFab ? (
        <ActiveRouteFAB
          bottomOffset={shouldHideBottomNav ? 24 : 86}
          onPress={() => {
            router.push(`/routes/${activeNavigationRouteId}/navigate` as Href);
          }}
        />
      ) : null}
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
    overflow: "visible",
  },
});
