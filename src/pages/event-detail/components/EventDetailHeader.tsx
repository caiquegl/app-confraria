import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventDetailHeaderProps = {
  onBack: () => void;
};

export function EventDetailHeader({ onBack }: EventDetailHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.header]}>
      <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
        <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
      </Pressable>
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
    backgroundColor: colors.brandGray,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
});
