import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

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

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingHorizontal: 24,
  },
  pill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
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
    color: "#6B7280",
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
