import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { EventsFilterChip } from "../types/events.types";

type EventsFilterChipsProps = {
  chips: EventsFilterChip[];
  onClearAll: () => void;
};

export function EventsFilterChips({ chips, onClearAll }: EventsFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <View style={styles.container}>
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          accessibilityRole="button"
          style={styles.chip}
          onPress={chip.onRemove}
        >
          <Text style={styles.chipText}>{chip.label}</Text>
          <Ionicons color={colors.brandDark} name="close" size={12} />
        </Pressable>
      ))}

      <Pressable accessibilityRole="button" style={styles.clearButton} onPress={onClearAll}>
        <Text style={styles.clearText}>Limpar tudo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.2)",
    borderColor: colors.brandGreen,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800",
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
});
