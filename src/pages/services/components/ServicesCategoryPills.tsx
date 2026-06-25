import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { ServiceCategory } from "../types/services.types";

const CATEGORIES: ServiceCategory[] = [
  "Tudo",
  "Acessórios",
  "Mecânicas",
  "Moto escolas",
  "Guinchos",
  "Hotéis",
];

type ServicesCategoryPillsProps = {
  selectedCategory: ServiceCategory;
  onChange: (category: ServiceCategory) => void;
};

export function ServicesCategoryPills({
  selectedCategory,
  onChange,
}: ServicesCategoryPillsProps) {
  return (
    <View>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const active = item === selectedCategory;
          return (
            <Pressable
              accessibilityRole="button"
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(item)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  pill: {
    borderColor: "#D1D5DB",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  pillText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "500",
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
