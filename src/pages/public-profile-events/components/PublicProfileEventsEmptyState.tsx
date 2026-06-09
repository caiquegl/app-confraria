import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

export function PublicProfileEventsEmptyState() {
  return (
    <View style={styles.emptyCard}>
      <Ionicons color="#9CA3AF" name="calendar-clear-outline" size={28} />
      <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
      <Text style={styles.emptyText}>Tente buscar por outro termo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 10,
  },
});
