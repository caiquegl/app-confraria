import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { FavoriteTab, FavoriteTabItem } from "../types/favorites.types";

type FavoritesTabsProps = {
  activeTab: FavoriteTab;
  onChangeTab: (tab: FavoriteTab) => void;
  tabs: FavoriteTabItem[];
};

export function FavoritesTabs({ activeTab, onChangeTab, tabs }: FavoritesTabsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChangeTab(tab.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {`${tab.label} (${tab.count})`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 9,
  },
  tabActive: {
    backgroundColor: colors.brandGreen,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: colors.text.onBrand,
    fontWeight: "900",
  },
  tabs: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
});
