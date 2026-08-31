import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { RoutePreferenceToggleKey, RoutePreferencesDraft } from "../types/route-create.types";
import {
  isPremiumRouteStyle,
  ROUTE_STYLE_LABELS,
  type RouteStyle,
} from "../types/route-style";

type RouteCreateStep3Props = {
  isPremium: boolean;
  onRequestPremium: () => void;
  onSelectRouteStyle: (style: RouteStyle) => void;
  onTogglePreference: (key: RoutePreferenceToggleKey) => void;
  preferences: RoutePreferencesDraft;
};

type PreferenceOption = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground: string;
  iconColor: string;
  key: RoutePreferenceToggleKey;
  title: string;
};

type RouteStyleOption = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground: string;
  iconColor: string;
  value: RouteStyle;
};

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    description: "Pode aumentar o tempo de viagem",
    icon: "settings-outline",
    iconBackground: "#FFEDD5",
    iconColor: "#EA580C",
    key: "avoidTolls",
    title: "Evitar Pedágios",
  },
  {
    description: "Prefere asfalto sempre que existir alternativa",
    icon: "earth-outline",
    iconBackground: "#FEF3C7",
    iconColor: "#B45309",
    key: "avoidUnpaved",
    title: "Evitar estrada de terra",
  },
  {
    description: "Rota mais econômica",
    icon: "water-outline",
    iconBackground: "#DCFCE7",
    iconColor: "#16A34A",
    key: "optimizeFuel",
    title: "Otimizar Combustível",
  },
];

const ROUTE_STYLE_OPTIONS: RouteStyleOption[] = [
  {
    description: "Mais rápida, prioriza rodovia",
    icon: "navigate-outline",
    iconBackground: "#E8F0FE",
    iconColor: "#2563EB",
    value: "direct",
  },
  {
    description: "Prefere curvas e estradas menores",
    icon: "git-compare-outline",
    iconBackground: "#ECFCCB",
    iconColor: "#4D7C0F",
    value: "winding",
  },
  {
    description: "Máximo de serra e curvas",
    icon: "shuffle-outline",
    iconBackground: "#DCFCE7",
    iconColor: "#16A34A",
    value: "super_winding",
  },
];

export function RouteCreateStep3({
  isPremium,
  onRequestPremium,
  onSelectRouteStyle,
  onTogglePreference,
  preferences,
}: RouteCreateStep3Props) {
  const handleToggleStyle = (style: RouteStyle) => {
    const next = preferences.routeStyle === style ? "direct" : style;

    console.log("[CON-49] select style", {
      current: preferences.routeStyle,
      isPremium,
      next,
    });

    if (isPremiumRouteStyle(next) && !isPremium) {
      onRequestPremium();
      return;
    }

    onSelectRouteStyle(next);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <Text style={styles.title}>Ajustes da viagem</Text>
      <Text style={styles.subtitle}>
        As preferências mudam o jeito como o mapa interpreta o seu passeio.
      </Text>

      <Text style={styles.sectionLabel}>Perfil da rota</Text>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {ROUTE_STYLE_OPTIONS.map((option) => {
          const isEnabled = preferences.routeStyle === option.value;
          const locked = isPremiumRouteStyle(option.value) && !isPremium;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="switch"
              accessibilityState={{ checked: isEnabled, disabled: false }}
              style={styles.card}
              onPress={() => handleToggleStyle(option.value)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconWrap, { backgroundColor: option.iconBackground }]}>
                  <Ionicons color={option.iconColor} name={option.icon} size={20} />
                </View>

                <View style={styles.copy}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{ROUTE_STYLE_LABELS[option.value]}</Text>
                    {locked ? (
                      <Ionicons color="#9CA3AF" name="lock-closed" size={12} />
                    ) : null}
                  </View>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                </View>
              </View>

              <View style={[styles.toggleTrack, isEnabled && styles.toggleTrackOn]}>
                <View style={[styles.toggleThumb, isEnabled && styles.toggleThumbOn]} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {PREFERENCE_OPTIONS.map((option) => {
          const isEnabled = preferences[option.key];

          return (
            <Pressable
              key={option.key}
              accessibilityRole="switch"
              accessibilityState={{ checked: isEnabled }}
              style={styles.card}
              onPress={() => onTogglePreference(option.key)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconWrap, { backgroundColor: option.iconBackground }]}>
                  <Ionicons color={option.iconColor} name={option.icon} size={20} />
                </View>

                <View style={styles.copy}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                </View>
              </View>

              <View style={[styles.toggleTrack, isEnabled && styles.toggleTrackOn]}>
                <View style={[styles.toggleThumb, isEnabled && styles.toggleThumbOn]} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 16,
  },
  cardContent: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },
  cardDescription: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  cardTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  list: {
    gap: 16,
    marginTop: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionLabel: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 20,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "800",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  toggleThumb: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: 20,
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    width: 20,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  toggleTrack: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    padding: 4,
    width: 48,
  },
  toggleTrackOn: {
    backgroundColor: colors.brandGreen,
  },
});
