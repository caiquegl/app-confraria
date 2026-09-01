import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventEditSectionProps = {
  children: React.ReactNode;
  title: string;
};

export function EventEditSection({ children, title }: EventEditSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  content: {
    gap: 20,
  },
  section: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    marginBottom: 16,
    padding: 16,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
});
