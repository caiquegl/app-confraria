import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventFormFieldProps = TextInputProps & {
  label: string;
};

export function EventFormField({ label, multiline, style, ...props }: EventFormFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor={colors.text.placeholder}
        style={[styles.input, multiline && styles.inputMultiline, style]}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  input: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 118,
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
});
