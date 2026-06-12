import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";
import type { BikeCategory, CurvePreference } from "@/pages/wizard/types/wizard.types";

type BikeCategoriesEditorModalProps = {
  categories: BikeCategory[];
  curvePreferences: CurvePreference[];
  isSaving?: boolean;
  selectedCategoryIds: string[];
  selectedCurvePreferenceId?: string | null;
  customBikeCategory?: string | null;
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    bikeCategoryIds: string[];
    curvePreferenceId: string | null;
    customBikeCategory: string | null;
  }) => Promise<void>;
};

export function BikeCategoriesEditorModal({
  categories,
  curvePreferences,
  isSaving = false,
  selectedCategoryIds,
  selectedCurvePreferenceId = null,
  customBikeCategory = null,
  visible,
  onClose,
  onSave,
}: BikeCategoriesEditorModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCategoryIds);
  const [selectedCurveId, setSelectedCurveId] = useState<string | null>(
    selectedCurvePreferenceId,
  );
  const [customCategory, setCustomCategory] = useState(customBikeCategory ?? "");
  const [keyboardSpace, setKeyboardSpace] = useState(0);
  const [sheetState, setSheetState] = useState<"compact" | "normal" | "full">(
    "normal",
  );

  useEffect(() => {
    if (!visible || isSaving) return;

    queueMicrotask(() => {
      setSelectedIds(selectedCategoryIds);
      setSelectedCurveId(selectedCurvePreferenceId);
      setCustomCategory(customBikeCategory ?? "");
      setKeyboardSpace(0);
      setSheetState("normal");
    });
  }, [customBikeCategory, isSaving, selectedCategoryIds, selectedCurvePreferenceId, visible]);

  useEffect(() => {
    if (!visible) return;

    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardSpace(event.endCoordinates.height);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardSpace(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible]);

  const sheetHeight =
    sheetState === "full" ? height : sheetState === "normal" ? height * 0.8 : height * 0.4;

  const cycleSheet = () => {
    setSheetState((current) =>
      current === "normal" ? "full" : current === "full" ? "compact" : "normal",
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const selectCurvePreference = (preferenceId: string) => {
    setSelectedCurveId((current) => (current === preferenceId ? null : preferenceId));
  };

  const handleSave = async () => {
    if (selectedIds.length === 0 || isSaving) return;
    await onSave({
      bikeCategoryIds: selectedIds,
      curvePreferenceId: selectedCurveId,
      customBikeCategory: customCategory.trim() || null,
    });
  };

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={styles.closeArea} onPress={onClose} />

        <View style={[styles.sheet, { height: sheetHeight }]}>
          <Pressable
            accessibilityLabel="Expandir ou recolher"
            accessibilityRole="button"
            style={styles.grabberButton}
            onPress={cycleSheet}
          >
            <View style={styles.grabber} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Estilos de Estrada</Text>
            <Pressable
              accessibilityLabel="Fechar"
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons color="#9CA3AF" name="close" size={24} />
            </Pressable>
          </View>

          <Text style={styles.description}>
            Esses dados vêm do seu cadastro e personalizam seu feed, eventos e rotas.
            Atualize quando quiser.
          </Text>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.content,
              keyboardSpace > 0 && { paddingBottom: keyboardSpace + 24 },
            ]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Preferência de traçado</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Influencia como suas rotas são criadas: mais curvas e serra, ou
                trechos retos e rápidos.
              </Text>
              <View style={styles.optionList}>
                {curvePreferences.map((preference) => (
                  <RoadStyleOption
                    key={preference.id}
                    fullWidth
                    icon={preference.icon}
                    label={preference.name}
                    selected={selectedCurveId === preference.id}
                    onPress={() => selectCurvePreference(preference.id)}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.sectionDivider]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categoria da sua moto</Text>
                <Text style={styles.sectionMeta}>do cadastro</Text>
              </View>
              <View style={styles.grid}>
                {categories.map((category) => {
                  const isSelected = selectedIds.includes(category.id);

                  return (
                    <RoadStyleOption
                      key={category.id}
                      compact
                      label={category.name}
                      selected={isSelected}
                      onPress={() => toggleCategory(category.id)}
                    />
                  );
                })}
              </View>
              <TextInput
                autoCapitalize="sentences"
                placeholder="Não achou? Digite sua categoria..."
                placeholderTextColor="#9CA3AF"
                style={styles.customCategoryInput}
                value={customCategory}
                onChangeText={setCustomCategory}
                onFocus={() => {
                  requestAnimationFrame(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  });
                }}
              />
            </View>
          </ScrollView>

          <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button
              disabled={isSaving}
              size="lg"
              style={styles.actionButton}
              variant="secondary"
              onPress={onClose}
            >
              Cancelar
            </Button>
            <Button
              disabled={isSaving || selectedIds.length === 0}
              size="lg"
              style={styles.actionButton}
              onPress={() => void handleSave()}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RoadStyleOption({
  compact = false,
  fullWidth = false,
  icon,
  label,
  selected,
  onPress,
}: {
  compact?: boolean;
  fullWidth?: boolean;
  icon?: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const iconName = (icon ?? (selected ? "checkmark-circle" : "ellipse-outline")) as
    keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.option,
        compact && styles.optionCompact,
        fullWidth && styles.optionFull,
        selected && styles.optionSelected,
      ]}
      onPress={onPress}
    >
      {compact ? null : (
        <Ionicons
          color={selected ? colors.brandDark : colors.brandPrimary}
          name={iconName}
          size={22}
        />
      )}
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  closeArea: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 26,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 24,
  },
  customCategoryInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  grabber: {
    backgroundColor: "#D1D5DB",
    borderRadius: 999,
    height: 4,
    width: 40,
  },
  grabberButton: {
    alignItems: "center",
    paddingBottom: 10,
    paddingTop: 10,
  },
  option: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
    justifyContent: "center",
    minHeight: 82,
    padding: 12,
    width: "47%",
  },
  optionCompact: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionList: {
    gap: 10,
  },
  optionFull: {
    flexDirection: "row",
    justifyContent: "flex-start",
    minHeight: 58,
    width: "100%",
  },
  optionSelected: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  optionText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  optionTextSelected: {
    color: colors.brandDark,
  },
  section: {
    gap: 10,
  },
  sectionDescription: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
  },
  sectionDivider: {
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    paddingTop: 24,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionMeta: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  selectedItem: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  selectedList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    gap: 8,
    padding: 10,
  },
  selectedText: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  sheet: {
    backgroundColor: colors.brandGray,
    borderColor: "#E5E7EB",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    elevation: 12,
    overflow: "hidden",
    shadowColor: "#1C2126",
    shadowOffset: { height: -18, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
});
