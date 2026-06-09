import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

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
  return (
    <View style={styles.feedbackCard}>
      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} />
      ) : (
        <Ionicons color="#9CA3AF" name={icon} size={34} />
      )}
      <Text style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 32,
  },
  feedbackText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
