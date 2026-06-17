import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { BRAZILIAN_STATES } from "../constants/brazilian-states";
import {
  DEFAULT_EVENTS_FILTERS,
  type EventsFilters,
} from "../types/events-filters.types";
import { formatDistanceStep } from "../utils/events-filters.utils";

import { DistanceRangeSlider } from "./DistanceRangeSlider";

type EventsFiltersSheetProps = {
  categories: string[];
  draftFilters: EventsFilters;
  onApply: () => void;
  onChangeDraft: (nextFilters: EventsFilters) => void;
  onClose: () => void;
  onResetDraft: () => void;
  visible: boolean;
};

function FilterPill({
  isActive,
  label,
  onPress,
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={[styles.pill, isActive && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function EventsFiltersSheet({
  categories,
  draftFilters,
  onApply,
  onChangeDraft,
  onClose,
  onResetDraft,
  visible,
}: EventsFiltersSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scrollMaxHeight = windowHeight * 0.55;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Descoberta inteligente</Text>
              <Text style={styles.title}>Filtros de eventos</Text>
            </View>
            <Pressable accessibilityRole="button" style={styles.closeButton} onPress={onClose}>
              <Ionicons color="#9CA3AF" name="close" size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: scrollMaxHeight }}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de evento</Text>
              <View style={styles.pillWrap}>
                <FilterPill
                  isActive={draftFilters.category === "ALL"}
                  label="Todos"
                  onPress={() => onChangeDraft({ ...draftFilters, category: "ALL" })}
                />
                {categories.map((category) => (
                  <FilterPill
                    key={category}
                    isActive={draftFilters.category === category}
                    label={category}
                    onPress={() => onChangeDraft({ ...draftFilters, category })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.distanceHeader}>
                <Text style={styles.sectionTitle}>Distância de mim</Text>
                <Text style={styles.distanceValue}>
                  {formatDistanceStep(draftFilters.distanceRange[0])} –{" "}
                  {formatDistanceStep(draftFilters.distanceRange[1])}
                </Text>
              </View>
              <Text style={styles.sectionHint}>
                Eventos nessa faixa de distância a partir da sua localização
              </Text>
              <DistanceRangeSlider
                value={draftFilters.distanceRange}
                onChange={(distanceRange) => onChangeDraft({ ...draftFilters, distanceRange })}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Região/Local</Text>
              <View style={styles.pillWrap}>
                <FilterPill
                  isActive={draftFilters.state === "ALL"}
                  label="Todos"
                  onPress={() => onChangeDraft({ ...draftFilters, state: "ALL" })}
                />
                {BRAZILIAN_STATES.map((state) => (
                  <FilterPill
                    key={state.uf}
                    isActive={draftFilters.state === state.uf}
                    label={state.name}
                    onPress={() => onChangeDraft({ ...draftFilters, state: state.uf })}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable accessibilityRole="button" style={styles.resetButton} onPress={onResetDraft}>
              <Text style={styles.resetButtonText}>Limpar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.applyButton} onPress={onApply}>
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export { DEFAULT_EVENTS_FILTERS };

const styles = StyleSheet.create({
  applyButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    flex: 1,
    paddingVertical: 12,
  },
  applyButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  distanceHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  distanceValue: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 4,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
  },
  pill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  pillText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },
  pillTextActive: {
    color: colors.brandDark,
  },
  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  resetButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  resetButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 8,
  },
  section: {
    gap: 12,
  },
  sectionHint: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxWidth: 390,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: "100%",
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
  },
});
