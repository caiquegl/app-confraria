import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";

type EventEditableListProps = {
  items: string[];
  label: string;
  onChange: (items: string[]) => void;
  placeholder: string;
};

export function EventEditableList({
  items,
  label,
  onChange,
  placeholder,
}: EventEditableListProps) {
  const [value, setValue] = useState("");

  const addItem = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    onChange([...items, trimmed]);
    setValue("");
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={addItem}
        />
        <Pressable accessibilityRole="button" style={styles.addButton} onPress={addItem}>
          <Ionicons color={colors.brandDark} name="add" size={22} />
        </Pressable>
      </View>

      {items.length > 0 ? (
        <View style={styles.chips}>
          {items.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Ionicons color="#166534" name="close" size={13} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chipText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    color: colors.brandDark,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
});
