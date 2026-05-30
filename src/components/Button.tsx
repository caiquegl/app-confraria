import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type TouchableOpacityProps,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";

type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg";

type ButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

export function Button({
  children,
  disabled,
  size = "default",
  style,
  textStyle,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      disabled={disabled}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, sizeTextStyles[size], variantTextStyles[variant], textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  default: { height: 40, paddingHorizontal: 16 },
  lg: { height: 48, paddingHorizontal: 24 },
  sm: { height: 32, paddingHorizontal: 12 },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  default: { fontSize: 14 },
  lg: { fontSize: 16 },
  sm: { fontSize: 13 },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  default: { backgroundColor: colors.brandGreen },
  destructive: { backgroundColor: "#EF4444" },
  ghost: { backgroundColor: "transparent" },
  outline: { backgroundColor: "transparent", borderColor: "#D1D5DB", borderWidth: 1 },
  secondary: { backgroundColor: "#FFFFFF", borderColor: "#F3F4F6", borderWidth: 1 },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  default: { color: colors.brandDark },
  destructive: { color: "#FFFFFF" },
  ghost: { color: "#6B7280" },
  outline: { color: colors.brandDark },
  secondary: { color: colors.brandDark },
};
