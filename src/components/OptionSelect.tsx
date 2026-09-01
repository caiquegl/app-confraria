import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type OptionSelectProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  flex?: number;
};

export function OptionSelect({ flex, label, onPress, selected }: OptionSelectProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.container, selected && styles.containerSelected, flex ? { flex } : undefined]}
    >
      <Ionicons
        name={selected ? "checkbox" : "square-outline"}
        size={20}
        color={selected ? colors.brandGreen : colors.border.default}
        style={styles.icon}
      />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => ({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
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
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "500",
  },
  labelSelected: {
    color: colors.brandDark,
  },
});
