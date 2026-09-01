import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventsCategoryPillsProps = {
  categories: string[];
  onChange: (category: string) => void;
  selectedCategory: string;
};

export function EventsCategoryPills({
  categories,
  onChange,
  selectedCategory,
}: EventsCategoryPillsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const pills = ["Tudo", ...categories];

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {pills.map((category) => {
        const isActive = selectedCategory === category;

        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onChange(category)}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{category}</Text>
          </Pressable>
        );
      })}
      <View style={styles.trailingSpacer} />
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => ({
  content: {
    gap: 8,
    paddingHorizontal: 24,
  },
  pill: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  pillText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "700",
  },
  pillTextActive: {
    color: colors.brandDark,
  },
  scroll: {
    marginBottom: 24,
  },
  trailingSpacer: {
    width: 24,
  },
});
