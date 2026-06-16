import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventEditSectionProps = {
  children: React.ReactNode;
  title: string;
};

export function EventEditSection({ children, title }: EventEditSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
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
