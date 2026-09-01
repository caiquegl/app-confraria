import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { PublicProfileEventTab } from "../types/public-profile-events.types";

type PublicProfileEventsTabsProps = {
  activeTab: PublicProfileEventTab;
  onChangeTab: (tab: PublicProfileEventTab) => void;
  tabs: PublicProfileEventTab[];
};

export function PublicProfileEventsTabs({
  activeTab,
  onChangeTab,
  tabs,
}: PublicProfileEventsTabsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const active = tab === activeTab;

        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChangeTab(tab)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
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
  tabs: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 20,
    padding: 4,
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
});
