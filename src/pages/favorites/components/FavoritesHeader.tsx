import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type FavoritesHeaderProps = {
  onBack: () => void;
};

export function FavoritesHeader({ onBack }: FavoritesHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.header, { paddingTop: 12 }]}>
      <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
        <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
      </Pressable>
      <Text style={styles.headerTitle}>Favoritos</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  headerSpacer: {
    height: 48,
    width: 48,
  },
  headerTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
  },
});
