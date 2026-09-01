import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type FavoritesFeedbackCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  message: string;
};

export function FavoritesFeedbackCard({
  icon,
  loading = false,
  message,
}: FavoritesFeedbackCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.feedbackCard}>
      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} />
      ) : (
        <Ionicons color={colors.text.muted} name={icon} size={34} />
      )}
      <Text style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  feedbackCard: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 32,
  },
  feedbackText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
