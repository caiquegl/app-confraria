import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useCallback, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

type AuthRoute = "/feed" | "/events" | "/routes" | "/services" | "/profile";

type NavItem = {
  href: AuthRoute;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  matchPaths: string[];
  isProfile?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/feed",
    icon: "people-outline",
    label: "Feed",
    matchPaths: ["/feed", "/feed/liked"],
  },
  {
    href: "/events",
    icon: "calendar-outline",
    label: "Eventos",
    matchPaths: ["/events"],
  },
  {
    href: "/routes",
    icon: "navigate-outline",
    label: "Rotas",
    matchPaths: ["/routes"],
  },
  {
    href: "/services",
    icon: "card-outline",
    label: "Serviços",
    matchPaths: ["/services"],
  },
  {
    href: "/profile",
    icon: "person",
    label: "Perfil",
    isProfile: true,
    matchPaths: ["/profile"],
  },
];

const NAVIGATION_COOLDOWN_MS = 400;

type BottomNavProps = {
  userAvatar?: string | null;
  userName?: string | null;
};

export function BottomNav({ userAvatar, userName }: BottomNavProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isNavigatingRef = useRef(false);

  const isActive = useCallback(
    (item: NavItem) =>
      item.matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
    [pathname],
  );

  const handlePress = useCallback(
    (item: NavItem) => {
      if (isActive(item) || isNavigatingRef.current) {
        return;
      }

      isNavigatingRef.current = true;
      router.replace(item.href);

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, NAVIGATION_COOLDOWN_MS);
    },
    [isActive],
  );

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);

        return (
          <TouchableOpacity
            key={item.href}
            activeOpacity={active ? 1 : 0.7}
            disabled={active}
            style={styles.item}
            onPress={() => handlePress(item)}
          >
            <View style={[styles.indicator, active && styles.indicatorActive]} />

            {item.isProfile ? (
              <View style={styles.avatarRing}>
                <UserAvatar
                  avatarUrl={userAvatar}
                  name={userName || "Perfil"}
                  size={24}
                  style={styles.avatar}
                />
              </View>
            ) : (
              <Ionicons
                color={active ? colors.brandPrimary : "#6B7280"}
                name={item.icon}
                size={22}
              />
            )}

            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    width: 24,
  },
  avatarRing: {
    borderRadius: 14,
    padding: 2,
  },
  bar: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    elevation: 12,
    flexDirection: "row",
    shadowColor: "#000000",
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  indicator: {
    backgroundColor: "transparent",
    borderRadius: 999,
    height: 2,
    left: 8,
    position: "absolute",
    right: 8,
    top: 0,
  },
  indicatorActive: {
    backgroundColor: colors.brandPrimary,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 8,
    position: "relative",
  },
  label: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "400",
  },
  labelActive: {
    color: colors.brandPrimary,
    fontWeight: "600",
  },
});
