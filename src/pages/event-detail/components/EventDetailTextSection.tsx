import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventDetailTextSectionProps = {
  text: string;
  title: string;
};

export function EventDetailTextSection({ text, title }: EventDetailTextSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  card: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  text: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
});
