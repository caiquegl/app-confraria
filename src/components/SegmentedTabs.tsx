import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

export type SegmentedTabItem<T extends string> = {
  count?: number;
  key: T;
  label: string;
};

type SegmentedTabsProps<T extends string> = {
  activeTab: T;
  onChange: (tab: T) => void;
  tabs: SegmentedTabItem<T>[];
};

export function SegmentedTabs<T extends string>({
  activeTab,
  onChange,
  tabs,
}: SegmentedTabsProps<T>) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {typeof tab.count === "number" ? `${tab.label} (${tab.count})` : tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  container: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.brandGreen,
    shadowColor: colors.surface.video,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.brandDark,
    fontWeight: "700",
  },
});
