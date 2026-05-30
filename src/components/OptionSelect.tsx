import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { colors } from "@/theme/colors";

type OptionSelectProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  flex?: number;
};

export function OptionSelect({ flex, label, onPress, selected }: OptionSelectProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.container, selected && styles.containerSelected, flex ? { flex } : undefined]}
    >
      <Ionicons
        name={selected ? "checkbox" : "square-outline"}
        size={20}
        color={selected ? colors.brandGreen : "#D1D5DB"}
        style={styles.icon}
      />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: "100%",
  },
  containerSelected: {
    borderColor: colors.brandGreen,
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
  },
  labelSelected: {
    color: colors.brandDark,
  },
});
