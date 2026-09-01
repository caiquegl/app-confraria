import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { EventAnalyticsTab } from "../types/event-analytics.types";

const TABS: { key: EventAnalyticsTab; label: string }[] = [
  { key: "detalhes", label: "Detalhes" },
  { key: "analiticas", label: "Analytics" },
];

type EventAnalyticsTabsProps = {
  activeTab: EventAnalyticsTab;
  onChangeTab: (tab: EventAnalyticsTab) => void;
};

export function EventAnalyticsTabs({
  activeTab,
  onChangeTab,
}: EventAnalyticsTabsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.tabs}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChangeTab(tab.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
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
  tabs: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
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
