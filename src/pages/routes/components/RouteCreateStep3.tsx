import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { RoutePreferenceToggleKey, RoutePreferencesDraft } from "../types/route-create.types";

type RouteCreateStep3Props = {
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

function getPreferenceOptions(colors: AppColors): PreferenceOption[] {
  return [
    {
      description: "Pode aumentar o tempo de viagem",
      icon: "settings-outline",
      iconBackground: colors.routes.suggestionWarningBackground,
      iconColor: colors.routes.pinOrange,
      key: "avoidTolls",
      title: "Evitar Pedágios",
    },
    {
      description: "Prefere asfalto sempre que existir alternativa",
      icon: "earth-outline",
      iconBackground: colors.routes.sponsoredBackground,
      iconColor: colors.routes.suggestionWarningText,
      key: "avoidUnpaved",
      title: "Evitar estrada de terra",
    },
    {
      description: "Rota mais econômica",
      icon: "water-outline",
      iconBackground: colors.surface.successSubtle,
      iconColor: colors.status.open,
      key: "optimizeFuel",
      title: "Otimizar Combustível",
    },
  ];
}

export function RouteCreateStep3({
  onTogglePreference,
  preferences,
}: RouteCreateStep3Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const preferenceOptions = getPreferenceOptions(colors);
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

      <View style={styles.list}>
        {preferenceOptions.map((option) => {
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

const createStyles = (colors: AppColors) => ({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
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
    color: colors.text.secondary,
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
    marginTop: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "800",
  },
  toggleThumb: {
    backgroundColor: colors.surface.primary,
    borderRadius: 999,
    height: 20,
    shadowColor: colors.surface.video,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    width: 20,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  toggleTrack: {
    backgroundColor: colors.border.subtle,
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
