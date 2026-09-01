import { Ionicons } from "@expo/vector-icons";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";

type ThemeToggleButtonProps = {
  accessibilityLabel?: string;
  hitSlop?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

export function ThemeToggleButton({
  accessibilityLabel,
  hitSlop = 8,
  iconSize = 20,
  style,
}: ThemeToggleButtonProps) {
  const { colors, isDark, toggleColorScheme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ?? (isDark ? "Ativar tema claro" : "Ativar tema escuro")
      }
      accessibilityRole="button"
      hitSlop={hitSlop}
      style={style}
      onPress={() => {
        void toggleColorScheme();
      }}
    >
      <Ionicons
        color={colors.text.secondary}
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={iconSize}
      />
    </Pressable>
  );
}
