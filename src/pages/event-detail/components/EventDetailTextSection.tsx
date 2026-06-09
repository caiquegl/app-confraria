import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventDetailTextSectionProps = {
  text: string;
  title: string;
};

export function EventDetailTextSection({ text, title }: EventDetailTextSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  text: {
    color: "#6B7280",
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
