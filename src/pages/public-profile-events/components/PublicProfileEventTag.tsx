import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type PublicProfileEventTagProps = {
  active?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

export function PublicProfileEventTag({
  active = false,
  icon,
  label,
}: PublicProfileEventTagProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.tag, active && styles.tagActive]}>
      <Ionicons
        color={active ? colors.text.success : colors.text.muted}
        name={icon}
        size={12}
      />
      <Text style={[styles.tagText, active && styles.tagTextActive]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    tag: {
      alignItems: "center",
      backgroundColor: colors.surface.primary,
      borderColor: colors.border.subtle,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: "row",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    tagActive: {
      backgroundColor: colors.surface.successSubtle,
      borderColor: colors.surface.successSubtle,
    },
    tagText: {
      color: colors.text.secondary,
      fontSize: 11,
      fontWeight: "800",
    },
    tagTextActive: {
      color: colors.text.success,
    },
  });
