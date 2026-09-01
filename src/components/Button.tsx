import { Children, isValidElement } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type TouchableOpacityProps,
  type ViewStyle,
} from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg";

type ButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

function renderButtonChildren(
  children: React.ReactNode,
  size: ButtonSize,
  variant: ButtonVariant,
  textStyle?: StyleProp<TextStyle>,
) {
  return Children.toArray(children).map((child, index) => {
    if (typeof child === "string" || typeof child === "number") {
      return (
        <Text
          key={`button-text-${index}`}
          style={[styles.text, sizeTextStyles[size], variantTextStyles[variant], textStyle]}
        >
          {child}
        </Text>
      );
    }

    return isValidElement(child) ? child : null;
  });
}

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
      {renderButtonChildren(children, size, variant, textStyle)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  default: { height: 40, paddingHorizontal: spacing["2xl"] },
  lg: { height: 48, paddingHorizontal: spacing["4xl"] },
  sm: { height: 32, paddingHorizontal: spacing.lg },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  default: typography.buttonMd,
  lg: typography.buttonLg,
  sm: typography.buttonSm,
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.accent.brand,
  },
  destructive: { backgroundColor: colors.feedback.danger },
  ghost: { backgroundColor: "transparent" },
  outline: {
    backgroundColor: "transparent",
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.surface.subtle,
    borderWidth: 1,
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  default: { color: colors.text.primary },
  destructive: { color: colors.feedback.dangerForeground },
  ghost: { color: colors.text.secondary },
  outline: { color: colors.text.primary },
  secondary: { color: colors.text.primary },
};
