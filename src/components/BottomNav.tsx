import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop";

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

type BottomNavProps = {
  userAvatar?: string;
};

export function BottomNav({ userAvatar }: BottomNavProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (item: NavItem) =>
    item.matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);

        return (
          <TouchableOpacity
            key={item.href}
            activeOpacity={0.7}
            style={styles.item}
            onPress={() => router.replace(item.href)}
          >
            <View style={[styles.indicator, active && styles.indicatorActive]} />

            {item.isProfile ? (
              <View style={[styles.avatarRing, active && styles.avatarRingActive]}>
                <Image
                  source={{ uri: userAvatar ?? DEFAULT_AVATAR }}
                  style={styles.avatar}
                  contentFit="cover"
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
    borderColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    width: 24,
  },
  avatarRing: {
    borderRadius: 14,
    padding: 2,
  },
  avatarRingActive: {
    backgroundColor: colors.brandPrimary,
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
