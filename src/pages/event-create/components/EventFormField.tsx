import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { colors } from "@/theme/colors";

type EventFormFieldProps = TextInputProps & {
  label: string;
};

export function EventFormField({ label, multiline, style, ...props }: EventFormFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, multiline && styles.inputMultiline, style]}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
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
