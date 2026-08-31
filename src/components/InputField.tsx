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

import { colors } from "@/theme/colors";

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
          placeholderTextColor="#9CA3AF"
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
            hitSlop={8}
            style={styles.icon}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              color="#9CA3AF"
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
            hitSlop={8}
            style={styles.icon}
            onPress={onClear}
          >
            <Ionicons color="#9CA3AF" name="close-circle" size={18} />
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

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  containerDefault: {
    borderColor: "#E5E7EB",
  },
  containerDisabled: {
    backgroundColor: "#F9FAFB",
    opacity: 0.7,
  },
  containerError: {
    borderColor: "#EF4444",
  },
  containerMultiline: {
    alignItems: "flex-start",
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
    marginLeft: 4,
    marginTop: 4,
  },
  helper: {
    color: "#6B7280",
    fontSize: 12,
    marginLeft: 4,
    marginTop: 4,
  },
  icon: {
    paddingLeft: 8,
    paddingVertical: 16,
  },
  input: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 15,
    paddingVertical: 16,
  },
  inputMultiline: {
    minHeight: 96,
    paddingBottom: 12,
    paddingTop: 12,
  },
  label: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  requiredMark: {
    color: "#EF4444",
    fontWeight: "700",
  },
  wrapper: {
    gap: 0,
  },
});
