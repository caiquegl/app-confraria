import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type CreatePublicProfileEventCardProps = {
  onPress: () => void;
};

export function CreatePublicProfileEventCard({ onPress }: CreatePublicProfileEventCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.brandPrimary} name="git-branch-outline" size={22} />
        </View>
        <Text style={styles.label}>Criar um Evento</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => ({
  card: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 24,
    borderWidth: 1,
    padding: 8,
  },
  content: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 18,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  label: {
    color: colors.text.comment,
    fontSize: 14,
    fontWeight: "700",
  },
});
