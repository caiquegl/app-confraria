import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { UserBike } from "@/pages/bikes/types/bikes.types";
import { colors } from "@/theme/colors";

import type { RouteCostEstimate } from "../types/route-cost.types";
import type { RouteDraftDay, RoutePreferencesDraft, TripIntent } from "../types/route-create.types";
import { formatRouteDistance, formatRouteDuration, getPlaceLabel } from "../utils/route-format.utils";
import {
  formatBrazilianDateInput,
  formatTimeInput,
  validateRouteSchedule,
} from "../utils/route-schedule.utils";

type RouteDaySummary = {
  dayId: string;
  dayLabel: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
};

type RouteCreateStep4Props = {
  costEstimate: RouteCostEstimate;
  daySummaries: RouteDaySummary[];
  days: RouteDraftDay[];
  onTripDateChange: (value: string) => void;
  onTripIntentChange: (value: TripIntent) => void;
  onTripNoteChange: (value: string) => void;
  onTripTimeChange: (value: string) => void;
  preferences: RoutePreferencesDraft;
  selectedBike: UserBike | null;
  totalDistanceMeters: number | null;
  totalDurationSeconds: number | null;
  tripDate: string;
  tripIntent: TripIntent;
  tripNote: string;
  tripTime: string;
};

export function RouteCreateStep4({
  costEstimate,
  daySummaries,
  days,
  onTripDateChange,
  onTripIntentChange,
  onTripNoteChange,
  onTripTimeChange,
  preferences,
  selectedBike,
  totalDistanceMeters,
  totalDurationSeconds,
  tripDate,
  tripIntent,
  tripNote,
  tripTime,
}: RouteCreateStep4Props) {
  const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToScheduleFields = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const originLabel = getPlaceLabel(days[0]?.origin);
  const destinationLabel = getPlaceLabel(days[days.length - 1]?.destination);
  const filledStopCount = days.reduce(
    (count, day) => count + day.stops.filter((stop) => getPlaceLabel(stop.place)).length,
    0,
  );

  const bikeName = selectedBike
    ? `${selectedBike.brand.name} ${selectedBike.model}`.trim()
    : "Moto selecionada";

  const rangeKm = selectedBike
    ? Math.round(selectedBike.baseConsumption * selectedBike.tankCapacity)
    : 0;

  const tollCost = costEstimate.tollCost;
  const fuelCost = costEstimate.fuelCost;
  const totalCost = costEstimate.totalCost;
  const tollCount = costEstimate.tollCount;
  const isCostLoading = costEstimate.isLoading;

  const formatCurrency = (value: number | null) =>
    value != null ? `R$ ${value.toFixed(2)}` : "—";

  const tollHint = preferences.avoidTolls
    ? "Sem pedágios"
    : tollCost != null && tollCost > 0 && tollCount != null
      ? `${tollCount} pedágio${tollCount > 1 ? "s" : ""}`
      : tollCost === 0
        ? "Sem pedágios"
        : costEstimate.tollAvailable
          ? "Sem pedágios"
          : "Estimativa indisponível";

  const fuelHint =
    costEstimate.fuel != null
      ? `${costEstimate.fuel.liters.toFixed(1)} L · ${costEstimate.fuel.stateCode} · R$ ${costEstimate.fuel.pricePerLiter.toFixed(2)}/L`
      : isCostLoading
        ? "Calculando..."
        : "Estimativa indisponível";

  const scheduleValidation = useMemo(
    () => (tripIntent === "later" ? validateRouteSchedule(tripDate, tripTime) : null),
    [tripDate, tripIntent, tripTime],
  );

  const routePathLabel = useMemo(() => {
    const parts: string[] = [];
    if (originLabel) parts.push(originLabel);
    if (filledStopCount > 0) {
      parts.push(`${filledStopCount} parada${filledStopCount > 1 ? "s" : ""}`);
    }
    if (destinationLabel) parts.push(destinationLabel);
    return parts.join(" → ") || "Defina origem e destino";
  }, [destinationLabel, filledStopCount, originLabel]);

  const toggleSummaryDay = (dayId: string) => {
    setExpandedDayIds((current) =>
      current.includes(dayId) ? current.filter((id) => id !== dayId) : [...current, dayId],
    );
  };

  const hasPreferences = preferences.avoidTolls || preferences.optimizeFuel;

  return (
    <ScrollView
      ref={scrollRef}
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <Text style={styles.title}>Resumo da viagem</Text>
      <Text style={styles.subtitle}>Confira os detalhes antes de partir.</Text>

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[colors.brandDark, colors.brandDark]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(200, 247, 99, 0)", "rgba(200, 247, 99, 0.22)"]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={styles.heroGlow}
        />

        <View style={styles.heroContent}>
          <View style={styles.heroEyebrow}>
            <Ionicons color={colors.brandGreen} name="map-outline" size={12} />
            <Text style={styles.heroEyebrowText}>Sua rota</Text>
          </View>

          <Text style={styles.heroDestination}>{destinationLabel || "Destino"}</Text>
          <Text style={styles.heroPath}>{routePathLabel}</Text>
          <Text style={styles.heroMeta}>
            {formatRouteDistance(totalDistanceMeters)} •{" "}
            {formatRouteDuration(totalDurationSeconds)}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.bikeRow}>
            {selectedBike?.imageUrl ? (
              <Image
                source={{ uri: selectedBike.imageUrl }}
                style={styles.bikeImage}
                cachePolicy="memory-disk"
                contentFit="cover"
              />
            ) : (
              <View style={styles.bikeImageFallback}>
                <Ionicons color="#9CA3AF" name="bicycle-outline" size={16} />
              </View>
            )}
            <Text numberOfLines={1} style={styles.bikeName}>
              {bikeName}
            </Text>
          </View>

          <View style={styles.bikeStats}>
            <View style={styles.bikeStat}>
              <Text style={styles.bikeStatValue}>{selectedBike?.baseConsumption ?? "—"} km/L</Text>
              <Text style={styles.bikeStatLabel}>Consumo</Text>
            </View>
            <View style={styles.bikeStatDivider} />
            <View style={styles.bikeStat}>
              <Text style={styles.bikeStatValue}>{selectedBike?.tankCapacity ?? "—"} L</Text>
              <Text style={styles.bikeStatLabel}>Tanque</Text>
            </View>
            <View style={styles.bikeStatDivider} />
            <View style={styles.bikeStat}>
              <Text style={[styles.bikeStatValue, styles.bikeStatValueAccent]}>
                ~{rangeKm} km
              </Text>
              <Text style={styles.bikeStatLabel}>Autonomia</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.preferenceRow}>
            {preferences.avoidTolls ? (
              <View style={styles.preferenceBadge}>
                <Text style={styles.preferenceBadgeText}>Sem pedágios</Text>
              </View>
            ) : null}
            {preferences.optimizeFuel ? (
              <View style={styles.preferenceBadge}>
                <Text style={styles.preferenceBadgeText}>Modo econômico</Text>
              </View>
            ) : null}
            {!hasPreferences ? (
              <View style={styles.preferenceBadgeMuted}>
                <Text style={styles.preferenceBadgeMutedText}>Sem preferências</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Custos estimados</Text>
        <Text style={styles.sectionHint}>Pedágio + combustível</Text>
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.costCarousel}
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.costCard, styles.costCardHighlight]}>
          <View style={[styles.costIconWrap, styles.costIconWrapHighlight]}>
            <Ionicons color={colors.brandDark} name="star" size={18} />
          </View>
          <Text style={styles.costLabel}>Total da rota</Text>
          <Text style={styles.costValue}>
            {isCostLoading && totalCost == null ? "..." : formatCurrency(totalCost)}
          </Text>
          <Text style={styles.costHint}>Pedágio + combustível</Text>
        </View>

        <View style={styles.costCard}>
          <View style={styles.costIconWrap}>
            <Ionicons color={colors.brandDark} name="navigate-outline" size={18} />
          </View>
          <Text style={styles.costLabelMuted}>Pedágios</Text>
          <Text style={styles.costValue}>
            {preferences.avoidTolls || tollCost === 0
              ? "Grátis"
              : tollCost != null
                ? formatCurrency(tollCost)
                : "—"}
          </Text>
          <Text style={styles.costHint}>{tollHint}</Text>
        </View>

        <View style={styles.costCard}>
          <View style={[styles.costIconWrap, styles.costIconWrapFuel]}>
            <Ionicons color="#3B82F6" name="water-outline" size={18} />
          </View>
          <Text style={styles.costLabelMuted}>Combustível</Text>
          <Text style={styles.costValue}>
            {isCostLoading && fuelCost == null ? "..." : formatCurrency(fuelCost)}
          </Text>
          <Text style={styles.costHint}>{fuelHint}</Text>
        </View>
      </ScrollView>

      <View style={styles.itineraryCard}>
        <View style={styles.itineraryHeader}>
          <Text style={styles.sectionTitle}>Roteiro do dia a dia</Text>
          <View style={styles.dayCountBadge}>
            <Text style={styles.dayCountBadgeText}>
              {days.length} dia{days.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        <View style={styles.itineraryList}>
          {days.map((day, dayIndex) => {
            const summary = daySummaries.find((item) => item.dayId === day.id);
            const isExpanded = expandedDayIds.includes(day.id);
            const stopNames = day.stops
              .map((stop) => getPlaceLabel(stop.place))
              .filter(Boolean);

            return (
              <View key={day.id} style={styles.dayCard}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.dayCardHeader}
                  onPress={() => toggleSummaryDay(day.id)}
                >
                  <View style={styles.dayCardCopy}>
                    <Text style={styles.dayCardTitle}>{day.label}</Text>
                    <Text style={styles.dayCardMeta}>
                      {formatRouteDistance(summary?.distanceMeters ?? null)} •{" "}
                      {formatRouteDuration(summary?.durationSeconds ?? null)}
                    </Text>
                  </View>
                  <Ionicons
                    color="#9CA3AF"
                    name="chevron-down"
                    size={16}
                    style={isExpanded ? styles.dayChevronExpanded : undefined}
                  />
                </Pressable>

                {isExpanded ? (
                  <View style={styles.dayCardBody}>
                    {stopNames.length === 0 ? (
                      <Text style={styles.dayEmptyText}>
                        Dia sem paradas. O trajeto segue direto.
                      </Text>
                    ) : (
                      stopNames.map((name, index) => (
                        <View key={`${day.id}-${name}-${index}`} style={styles.stopRow}>
                          <View style={styles.stopBadge}>
                            <Text style={styles.stopBadgeText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.stopName}>{name}</Text>
                        </View>
                      ))
                    )}

                    {dayIndex === days.length - 1 && destinationLabel ? (
                      <View style={styles.finalDestination}>
                        <Ionicons color={colors.brandGreen} name="location" size={14} />
                        <Text style={styles.finalDestinationText}>{destinationLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.scheduleCard}>
        <Text style={styles.sectionTitle}>Quando você quer sair?</Text>

        <View style={styles.intentSwitch}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: tripIntent === "now" }}
            style={[styles.intentOption, tripIntent === "now" && styles.intentOptionActive]}
            onPress={() => onTripIntentChange("now")}
          >
            <Text
              style={[styles.intentOptionText, tripIntent === "now" && styles.intentOptionTextActive]}
            >
              Sair agora
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: tripIntent === "later" }}
            style={[styles.intentOption, tripIntent === "later" && styles.intentOptionActive]}
            onPress={() => onTripIntentChange("later")}
          >
            <Text
              style={[
                styles.intentOptionText,
                tripIntent === "later" && styles.intentOptionTextActive,
              ]}
            >
              Agendar
            </Text>
          </Pressable>
        </View>

        {tripIntent === "later" ? (
          <View style={styles.scheduleFields}>
            <View style={styles.scheduleField}>
              <Text style={styles.fieldLabel}>Data *</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#9CA3AF"
                style={[
                  styles.fieldInput,
                  scheduleValidation?.dateError ? styles.fieldInputError : null,
                ]}
                value={tripDate}
                onChangeText={(value) => onTripDateChange(formatBrazilianDateInput(value))}
                onFocus={scrollToScheduleFields}
              />
              {scheduleValidation?.dateError ? (
                <Text style={styles.fieldError}>{scheduleValidation.dateError}</Text>
              ) : null}
            </View>
            <View style={styles.scheduleField}>
              <Text style={styles.fieldLabel}>Hora *</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={5}
                placeholder="08:00"
                placeholderTextColor="#9CA3AF"
                style={[
                  styles.fieldInput,
                  scheduleValidation?.timeError ? styles.fieldInputError : null,
                ]}
                value={tripTime}
                onChangeText={(value) => onTripTimeChange(formatTimeInput(value))}
                onFocus={scrollToScheduleFields}
              />
              {scheduleValidation?.timeError ? (
                <Text style={styles.fieldError}>{scheduleValidation.timeError}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.noteField}>
          <Text style={styles.fieldLabel}>Recado para o grupo (opcional)</Text>
          <TextInput
            multiline
            maxLength={280}
            placeholder="Ex: Saída cedo, café no Dia 1 e jantar em grupo na chegada."
            placeholderTextColor="#9CA3AF"
            style={[styles.fieldInput, styles.noteInput]}
            textAlignVertical="top"
            value={tripNote}
            onChangeText={onTripNoteChange}
            onFocus={scrollToScheduleFields}
          />
          <Text style={styles.noteCounter}>{tripNote.length}/280</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bikeImage: {
    borderRadius: 8,
    height: 24,
    width: 32,
  },
  bikeImageFallback: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    height: 24,
    justifyContent: "center",
    width: 32,
  },
  bikeName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  bikeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  bikeStat: {
    alignItems: "center",
    flex: 1,
  },
  bikeStatDivider: {
    backgroundColor: "rgba(255,255,255,0.1)",
    height: 28,
    width: 1,
  },
  bikeStatLabel: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 2,
  },
  bikeStatValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  bikeStatValueAccent: {
    color: colors.brandGreen,
  },
  bikeStats: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 12,
  },
  costCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: 180,
  },
  costCardHighlight: {
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderColor: colors.brandGreen,
  },
  costCarousel: {
    gap: 12,
    paddingRight: 24,
  },
  costHint: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 8,
  },
  costIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    marginBottom: 12,
    width: 36,
  },
  costIconWrapFuel: {
    backgroundColor: "#EFF6FF",
  },
  costIconWrapHighlight: {
    backgroundColor: "rgba(200, 247, 99, 0.2)",
  },
  costLabel: {
    color: "#6B7280",
    fontSize: 10,
    marginBottom: 4,
  },
  costLabelMuted: {
    color: "#9CA3AF",
    fontSize: 10,
    marginBottom: 4,
  },
  costValue: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  dayCardBody: {
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dayCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  dayCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayCardMeta: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  dayCardTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  dayChevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  dayCountBadge: {
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderColor: "rgba(200, 247, 99, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayCountBadgeText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  dayEmptyText: {
    color: "#6B7280",
    fontSize: 14,
  },
  fieldInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldInputError: {
    borderColor: "#EF4444",
  },
  fieldLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },
  fieldError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  finalDestination: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  finalDestinationText: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: colors.brandDark,
    borderRadius: 16,
    marginTop: 20,
    overflow: "hidden",
    padding: 16,
    position: "relative",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
  },
  heroGlow: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "42%",
  },
  heroDestination: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },
  heroDivider: {
    backgroundColor: "rgba(255,255,255,0.1)",
    height: 1,
    marginTop: 12,
  },
  heroEyebrow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  heroEyebrowText: {
    color: colors.brandGreen,
    fontSize: 12,
    fontWeight: "700",
  },
  heroMeta: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  heroPath: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 2,
  },
  intentOption: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 8,
  },
  intentOptionActive: {
    backgroundColor: colors.brandGreen,
  },
  intentOptionText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  intentOptionTextActive: {
    color: colors.brandDark,
    fontWeight: "700",
  },
  intentSwitch: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 12,
    padding: 4,
  },
  itineraryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  itineraryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itineraryList: {
    gap: 12,
    marginTop: 16,
  },
  noteCounter: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  noteField: {
    marginTop: 12,
  },
  noteInput: {
    minHeight: 88,
    paddingTop: 12,
  },
  preferenceBadge: {
    backgroundColor: "rgba(200, 247, 99, 0.2)",
    borderColor: "rgba(200, 247, 99, 0.4)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  preferenceBadgeMuted: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  preferenceBadgeMutedText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
  },
  preferenceBadgeText: {
    color: colors.brandGreen,
    fontSize: 12,
    fontWeight: "600",
  },
  preferenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  scheduleCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  scheduleField: {
    flex: 1,
  },
  scheduleFields: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  sectionHint: {
    color: "#6B7280",
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  stopBadge: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  stopBadgeText: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "800",
  },
  stopName: {
    color: "#4B5563",
    flex: 1,
    fontSize: 14,
  },
  stopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "800",
  },
});
