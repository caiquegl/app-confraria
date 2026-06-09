import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventDetailListSectionProps = {
  emptyText?: string;
  items: string[];
  title: string;
};

export function EventDetailListSection({
  emptyText = "Nenhum item informado.",
  items,
  title,
}: EventDetailListSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {items.length > 0 ? (
        <View style={styles.items}>
          {items.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Ionicons color={colors.brandGreen} name="chevron-forward" size={17} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>{emptyText}</Text>
      )}
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
  itemRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  itemText: {
    color: "#374151",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  items: {
    gap: 10,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
});
