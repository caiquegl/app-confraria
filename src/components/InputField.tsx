import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { colors } from "@/theme/colors";

type InputFieldProps = TextInputProps & {
  label: string;
  error?: string;
  onClear?: () => void;
};

export function InputField({ error, label, onClear, secureTextEntry, value, ...props }: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry === true;
  const hasValue = Boolean(value);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, error ? styles.containerError : styles.containerDefault]}>
        <TextInput
          style={styles.input}
          placeholder={label}
          placeholderTextColor="#9CA3AF"
          value={value}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...props}
        />

        {isPassword && (
          <Pressable style={styles.icon} onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={18}
              color="#9CA3AF"
            />
          </Pressable>
        )}

        {!isPassword && onClear && hasValue && (
          <Pressable style={styles.icon} onPress={onClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

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
  containerError: {
    borderColor: "#EF4444",
  },
  error: {
    color: "#EF4444",
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
  wrapper: {
    gap: 0,
  },
});
