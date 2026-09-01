import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type NewPostFloatingButtonProps = {
  onPress: () => void;
};

export function NewPostFloatingButton({ onPress }: NewPostFloatingButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      accessibilityLabel="Criar nova postagem"
      style={styles.button}
      onPress={onPress}
    >
      <Ionicons name="add" size={22} color={colors.brandDark} />
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => ({
  button: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    bottom: 18,
    elevation: 8,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    shadowColor: "#9FC132",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    width: 50,
    zIndex: 20,
  },
});
