import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventsHeaderSectionProps = {
  activeFiltersCount: number;
  onOpenFilters: () => void;
};

export function EventsHeaderSection({
  activeFiltersCount,
  onOpenFilters,
}: EventsHeaderSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>Eventos</Text>
        <Text style={styles.subtitle}>Encontros e passeios</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        style={styles.filtersButton}
        onPress={onOpenFilters}
      >
        <Ionicons color="#6B7280" name="settings-outline" size={16} />
        <Text style={styles.filtersText}>Filtros</Text>
        {activeFiltersCount > 0 ? (
          <View style={styles.filtersBadge}>
            <Text style={styles.filtersBadgeText}>{activeFiltersCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  filtersBadge: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 6,
  },
  filtersBadgeText: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "800",
  },
  filtersButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    paddingHorizontal: 16,
    flexShrink: 0,
  },
  filtersText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "900",
  },
});
