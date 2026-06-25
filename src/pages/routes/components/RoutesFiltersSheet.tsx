import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";
import { formatBrazilianDateInput } from "@/pages/event-create/services/event-create.service";

import type {
  RelativePeriod,
  RouteCompletionFilter,
  RouteStatusFilter,
  SavedRoute,
  SavedRouteFilters,
} from "../types/saved-route.types";
import {
  COMPLETION_OPTIONS,
  DEFAULT_ROUTE_FILTERS,
  QUICK_PERIOD_OPTIONS,
  STATUS_LABELS,
} from "../utils/saved-routes-filters.utils";

type RoutesFiltersSheetProps = {
  bikes: string[];
  draftFilters: SavedRouteFilters;
  onApply: () => void;
  onChangeDraft: (next: SavedRouteFilters) => void;
  onClear: () => void;
  onClose: () => void;
  visible: boolean;
};

function isoToBrazilianDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function brazilianDateToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function RoutesFiltersSheet({
  bikes,
  draftFilters,
  onApply,
  onChangeDraft,
  onClear,
  onClose,
  visible,
}: RoutesFiltersSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Lista inteligente</Text>
              <Text style={styles.title}>Filtros das rotas</Text>
            </View>
            <Pressable accessibilityRole="button" style={styles.closeButton} onPress={onClose}>
              <Ionicons color="#9CA3AF" name="close" size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Período</Text>
              <View style={styles.grid}>
                {([{ key: "ALL", label: "Todos" }, ...QUICK_PERIOD_OPTIONS] as const).map(
                  (option) => (
                    <Pressable
                      key={option.key}
                      accessibilityRole="button"
                      style={[
                        styles.chip,
                        draftFilters.period === option.key && styles.chipActive,
                      ]}
                      onPress={() =>
                        onChangeDraft({
                          ...draftFilters,
                          period: option.key as RelativePeriod,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          draftFilters.period === option.key && styles.chipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Intervalo customizado</Text>
              <View style={styles.dateRow}>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={isoToBrazilianDate(draftFilters.startDate)}
                  onChangeText={(value) =>
                    onChangeDraft({
                      ...draftFilters,
                      startDate: brazilianDateToIso(formatBrazilianDateInput(value)),
                    })
                  }
                />
                <TextInput
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={isoToBrazilianDate(draftFilters.endDate)}
                  onChangeText={(value) =>
                    onChangeDraft({
                      ...draftFilters,
                      endDate: brazilianDateToIso(formatBrazilianDateInput(value)),
                    })
                  }
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Moto</Text>
              <View style={styles.bikeList}>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.bikeOption, !draftFilters.bike && styles.bikeOptionActive]}
                  onPress={() => onChangeDraft({ ...draftFilters, bike: "" })}
                >
                  <Text style={[styles.bikeOptionText, !draftFilters.bike && styles.bikeOptionTextActive]}>
                    Todas as motos
                  </Text>
                </Pressable>
                {bikes.map((bike) => (
                  <Pressable
                    key={bike}
                    accessibilityRole="button"
                    style={[
                      styles.bikeOption,
                      draftFilters.bike === bike && styles.bikeOptionActive,
                    ]}
                    onPress={() => onChangeDraft({ ...draftFilters, bike })}
                  >
                    <Text
                      style={[
                        styles.bikeOptionText,
                        draftFilters.bike === bike && styles.bikeOptionTextActive,
                      ]}
                    >
                      {bike}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.wrapRow}>
                {(Object.keys(STATUS_LABELS) as RouteStatusFilter[]).map((status) => {
                  const isActive = draftFilters.statuses.includes(status);
                  return (
                    <Pressable
                      key={status}
                      accessibilityRole="button"
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() =>
                        onChangeDraft({
                          ...draftFilters,
                          statuses: isActive
                            ? draftFilters.statuses.filter((item) => item !== status)
                            : [...draftFilters.statuses, status],
                        })
                      }
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {STATUS_LABELS[status]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conclusão</Text>
              <View style={styles.wrapRow}>
                {(
                  [{ key: "ALL", label: "Todas" }, ...COMPLETION_OPTIONS] as {
                    key: RouteCompletionFilter;
                    label: string;
                  }[]
                ).map((option) => (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    style={[
                      styles.chip,
                      draftFilters.completion === option.key && styles.chipActive,
                    ]}
                    onPress={() =>
                      onChangeDraft({ ...draftFilters, completion: option.key })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        draftFilters.completion === option.key && styles.chipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={styles.clearButton}
              onPress={() => {
                onChangeDraft(DEFAULT_ROUTE_FILTERS);
                onClear();
                onClose();
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

export function getUniqueBikeNames(routes: SavedRoute[]) {
  return Array.from(new Set(routes.map((route) => route.bikeName).filter(Boolean)));
}

const styles = StyleSheet.create({
  applyButton: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  bikeList: {
    gap: 8,
  },
  bikeOption: {
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bikeOptionActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  bikeOptionText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  bikeOptionTextActive: {
    color: colors.brandDark,
  },
  chip: {
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  chipText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.brandDark,
  },
  clearButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  clearButtonText: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "700",
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
  content: {
    gap: 20,
    paddingBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
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
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scroll: {
    maxHeight: "70%",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "88%",
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
