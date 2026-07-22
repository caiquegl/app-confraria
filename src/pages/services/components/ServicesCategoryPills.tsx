import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { ServiceCategory } from "../types/services.types";

const CATEGORIES: ServiceCategory[] = [
  "Tudo",
  "Próximos",
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
          const isNearby = item === "Próximos";
          return (
            <Pressable
              accessibilityRole="button"
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(item)}
            >
              <View style={styles.pillInner}>
                {isNearby ? (
                  <Ionicons
                    color={colors.brandDark}
                    name="location"
                    size={13}
                  />
                ) : null}
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {item}
                </Text>
              </View>
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
  pillInner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  pillActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  pillText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "500",
  },
  pillTextActive: {
    color: colors.brandDark,
    fontWeight: "700",
  },
});
