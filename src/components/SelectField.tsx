import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
};

export function SelectField({ error, label, onChange, options, value }: SelectFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.trigger, error ? styles.triggerError : styles.triggerDefault]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : label}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.text.muted} />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(opt.value)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.brandDark} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    backgroundColor: colors.overlay.scrimLight,
    flex: 1,
    justifyContent: "flex-end",
  },
  error: {
    color: colors.feedback.danger,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 4,
  },
  option: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: `${colors.brandGreen}33`,
  },
  optionText: {
    color: colors.text.body,
    fontSize: 15,
  },
  optionTextSelected: {
    color: colors.text.onBrand,
    fontWeight: "600",
  },
  placeholder: {
    color: colors.text.muted,
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sheetTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  trigger: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  triggerDefault: {
    borderColor: colors.border.subtle,
  },
  triggerError: {
    borderColor: colors.feedback.danger,
  },
  triggerText: {
    color: colors.brandDark,
    fontSize: 15,
  },
});
