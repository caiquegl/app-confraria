import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";
import type { BikeCategory } from "@/pages/wizard/types/wizard.types";

type BikeCategoriesEditorModalProps = {
  categories: BikeCategory[];
  isSaving?: boolean;
  selectedCategoryIds: string[];
  visible: boolean;
  onClose: () => void;
  onSave: (categoryIds: string[]) => Promise<void>;
};

export function BikeCategoriesEditorModal({
  categories,
  isSaving = false,
  selectedCategoryIds,
  visible,
  onClose,
  onSave,
}: BikeCategoriesEditorModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCategoryIds);

  useEffect(() => {
    if (!visible) return;

    queueMicrotask(() => {
      setSelectedIds(selectedCategoryIds);
    });
  }, [selectedCategoryIds, visible]);

  const toggleCategory = (categoryId: string) => {
    setSelectedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0 || isSaving) return;
    await onSave(selectedIds);
  };

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={styles.closeArea} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Estilos de Estrada</Text>
            <Pressable accessibilityLabel="Fechar" style={styles.closeButton} onPress={onClose}>
              <Ionicons color="#9CA3AF" name="close" size={24} />
            </Pressable>
          </View>

          <Text style={styles.description}>
            Selecione as categorias da sua moto. Elas são as mesmas opções usadas no cadastro.
          </Text>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Disponíveis</Text>
              <View style={styles.grid}>
                {categories.map((category) => {
                  const isSelected = selectedIds.includes(category.id);

                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => toggleCategory(category.id)}
                    >
                      <Ionicons
                        color={isSelected ? colors.brandDark : colors.brandPrimary}
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                      />
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
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

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
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
    gap: 22,
    paddingBottom: 4,
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
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
    marginBottom: 12,
  },
  option: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
    minHeight: 94,
    justifyContent: "center",
    padding: 12,
    width: "47%",
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
});
