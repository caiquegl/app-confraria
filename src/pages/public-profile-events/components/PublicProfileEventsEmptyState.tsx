import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

export function PublicProfileEventsEmptyState() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.emptyCard}>
      <Ionicons color={colors.text.muted} name="calendar-clear-outline" size={28} />
      <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
      <Text style={styles.emptyText}>Tente buscar por outro termo.</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
  },
  emptyText: {
    color: colors.text.muted,
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
