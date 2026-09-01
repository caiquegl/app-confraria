import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useId, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { type AppColors, radii, spacing, typography, useTheme, useThemedStyles } from "@/theme";

export type InputFieldProps = TextInputProps & {
  error?: string;
  helperText?: string;
  label: string;
  onClear?: () => void;
  /** Shows a visible label above the control. Auth screens keep the placeholder-as-label pattern. */
  persistentLabel?: boolean;
  required?: boolean;
};

export const InputField = forwardRef<TextInput, InputFieldProps>(function InputField(
  {
    accessibilityHint,
    accessibilityLabel,
    autoCapitalize,
    editable = true,
    error,
    helperText,
    label,
    multiline = false,
    onClear,
    persistentLabel = false,
    placeholder,
    required = false,
    returnKeyType,
    secureTextEntry,
    style,
    value,
    ...props
  },
  ref,
) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [showPassword, setShowPassword] = useState(false);
  const reactId = useId();
  const inputId = `input-${reactId.replace(/:/g, "")}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const isPassword = secureTextEntry === true;
  const hasValue = Boolean(value);
  const isDisabled = editable === false;
  const a11yLabel = required ? `${label}, obrigatório` : label;
  const resolvedPlaceholder = placeholder ?? (persistentLabel ? undefined : label);

  return (
    <View style={styles.wrapper}>
      {persistentLabel ? (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.label}
        >
          {label}
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.container,
          multiline ? styles.containerMultiline : null,
          error ? styles.containerError : styles.containerDefault,
          isDisabled ? styles.containerDisabled : null,
        ]}
      >
        <TextInput
          {...props}
          ref={ref}
          accessibilityHint={accessibilityHint ?? error ?? helperText}
          accessibilityLabel={accessibilityLabel ?? a11yLabel}
          accessibilityState={{ disabled: isDisabled }}
          autoCapitalize={autoCapitalize ?? "none"}
          editable={editable}
          multiline={multiline}
          nativeID={inputId}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={colors.text.placeholder}
          returnKeyType={returnKeyType ?? (multiline ? "default" : undefined)}
          secureTextEntry={isPassword && !showPassword}
          style={[styles.input, multiline ? styles.inputMultiline : null, style]}
          textAlignVertical={multiline ? "top" : "center"}
          value={value}
        />

        {isPassword ? (
          <Pressable
            accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
            accessibilityRole="button"
            disabled={isDisabled}
            hitSlop={spacing.md}
            style={styles.icon}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              color={colors.text.muted}
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={18}
            />
          </Pressable>
        ) : null}

        {!isPassword && !multiline && onClear && hasValue ? (
          <Pressable
            accessibilityLabel="Limpar campo"
            accessibilityRole="button"
            disabled={isDisabled}
            hitSlop={spacing.md}
            style={styles.icon}
            onPress={onClear}
          >
            <Ionicons color={colors.text.muted} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          nativeID={errorId}
          style={styles.error}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text nativeID={helperId} style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const createStyles = (colors: AppColors) => ({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacing["2xl"],
  },
  containerDefault: {
    borderColor: colors.border.subtle,
  },
  containerDisabled: {
    backgroundColor: colors.surface.disabled,
    opacity: 0.7,
  },
  containerError: {
    borderColor: colors.feedback.danger,
  },
  containerMultiline: {
    alignItems: "flex-start",
  },
  error: {
    color: colors.feedback.danger,
    fontSize: typography.caption.fontSize,
    marginLeft: spacing.xs,
    marginTop: spacing.xs,
  },
  helper: {
    color: colors.text.secondary,
    fontSize: typography.caption.fontSize,
    marginLeft: spacing.xs,
    marginTop: spacing.xs,
  },
  icon: {
    paddingLeft: spacing.md,
    paddingVertical: spacing["2xl"],
  },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontSize: typography.input.fontSize,
    paddingVertical: spacing["2xl"],
  },
  inputMultiline: {
    minHeight: 96,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  requiredMark: {
    color: colors.feedback.danger,
    fontWeight: "700",
  },
  wrapper: {
    gap: 0,
  },
});
