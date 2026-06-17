import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventsEmptyFiltersCardProps = {
  isLoading?: boolean;
  onClearFilters: () => void;
};

export function EventsEmptyFiltersCard({
  isLoading = false,
  onClearFilters,
}: EventsEmptyFiltersCardProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
      <Text style={styles.emptyText}>Tente ajustar os filtros para ver mais resultados.</Text>
      <Pressable accessibilityRole="button" style={styles.clearButton} onPress={onClearFilters}>
        <Text style={styles.clearButtonText}>Limpar filtros</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignSelf: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyWrap: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    paddingVertical: 24,
  },
});
