import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

export type CommunityRoutesFilters = {
  minRating: number;
};

export const DEFAULT_COMMUNITY_ROUTE_FILTERS: CommunityRoutesFilters = {
  minRating: 0,
};

const RATING_OPTIONS = [0, 4, 4.5, 4.8] as const;

type CommunityRoutesFiltersSheetProps = {
  draftFilters: CommunityRoutesFilters;
  onApply: () => void;
  onChangeDraft: (next: CommunityRoutesFilters) => void;
  onClear: () => void;
  onClose: () => void;
  visible: boolean;
};

function formatRatingLabel(value: number) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (value <= 0) return "Qualquer";
  return `≥ ${value.toFixed(1).replace(".", ",")}`;
}

export function CommunityRoutesFiltersSheet({
  draftFilters,
  onApply,
  onChangeDraft,
  onClear,
  onClose,
  visible,
}: CommunityRoutesFiltersSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Comunidade</Text>
              <Text style={styles.title}>Filtros das rotas</Text>
            </View>
            <Pressable accessibilityRole="button" style={styles.closeButton} onPress={onClose}>
              <Ionicons color={colors.text.muted} name="close" size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nota mínima</Text>
              <View style={styles.grid}>
                {RATING_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    style={[
                      styles.chip,
                      draftFilters.minRating === option && styles.chipActive,
                    ]}
                    onPress={() =>
                      onChangeDraft({
                        ...draftFilters,
                        minRating: option,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        draftFilters.minRating === option && styles.chipTextActive,
                      ]}
                    >
                      {formatRatingLabel(option)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dificuldade e região</Text>
              <Text style={styles.comingSoon}>
                Filtros por dificuldade, região e comprimento da rota chegam em breve.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={styles.clearButton}
              onPress={() => {
                onChangeDraft(DEFAULT_COMMUNITY_ROUTE_FILTERS);
                onClear();
              }}
            >
              <Text style={styles.clearButtonText}>Limpar</Text>
            </Pressable>
            <Button size="lg" style={styles.applyButton} onPress={onApply}>
              Aplicar filtros
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    backgroundColor: "rgba(28, 33, 38, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  applyButton: {
    flex: 1,
  },
  chip: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: "rgba(200, 247, 99, 0.25)",
    borderColor: colors.brandGreen,
  },
  chipText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.brandDark,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  clearButton: {
    alignItems: "center",
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  clearButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  comingSoon: {
    color: colors.text.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    gap: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  eyebrow: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  footer: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  scroll: {
    maxHeight: 360,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  sheet: {
    backgroundColor: colors.brandGray,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  title: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "800",
  },
});
