import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PlaceAutocompleteField } from "@/components/PlaceAutocompleteField";
import type { PlaceReference } from "@/lib/places";
import type { RouteDaySuggestionsResponse } from "@/lib/places";
import { colors } from "@/theme/colors";

import type { RouteDraftDay } from "../types/route-create.types";
import { RouteDaySuggestions } from "./RouteDaySuggestions";
import { getDayColor } from "../utils/route-day.utils";
import { getDayOriginLabel } from "../utils/route-draft.utils";
import { toPlaceReference } from "../utils/route-place.utils";

import type { RouteStopSuggestion } from "@/lib/places";

type RouteDayCardProps = {
  day: RouteDraftDay;
  dayIndex: number;
  days: RouteDraftDay[];
  daySuggestions: RouteDaySuggestionsResponse | null;
  isActive: boolean;
  isFirstDay: boolean;
  isLoadingSuggestions: boolean;
  isLoadingMoreSuggestions: boolean;
  isSingleDay: boolean;
  onAddStop: () => void;
  onAddSuggestedStop: (suggestion: RouteStopSuggestion) => void;
  onLoadMoreSuggestions?: () => void;
  onChangeDestination: (place: PlaceReference | null) => void;
  onChangeOrigin: (place: PlaceReference | null) => void;
  onChangeStop: (stopId: string, place: PlaceReference | null) => void;
  onPress: () => void;
  onRemoveDay: () => void;
  onRemoveStop: (stopId: string) => void;
  onSuggestionsScrollBegin?: () => void;
  onSuggestionsScrollEnd?: () => void;
  width: number;
};

export function RouteDayCard({
  day,
  dayIndex,
  days,
  daySuggestions,
  isActive,
  isFirstDay,
  isLoadingSuggestions,
  isLoadingMoreSuggestions,
  isSingleDay,
  onAddStop,
  onAddSuggestedStop,
  onLoadMoreSuggestions,
  onChangeDestination,
  onChangeOrigin,
  onChangeStop,
  onPress,
  onRemoveDay,
  onRemoveStop,
  onSuggestionsScrollBegin,
  onSuggestionsScrollEnd,
  width,
}: RouteDayCardProps) {
  const dayColor = getDayColor(dayIndex);
  const derivedOriginLabel = getDayOriginLabel(days, dayIndex);

  return (
    <View style={[styles.card, { width }, isActive && styles.cardActive]}>
      <Pressable accessibilityRole="button" style={styles.header} onPress={onPress}>
        <View style={[styles.dayBadge, { backgroundColor: `${dayColor}33` }]}>
          <Text style={styles.dayBadgeText}>{dayIndex + 1}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.dayTitle}>{day.label}</Text>
          <Text style={styles.daySubtitle}>Configure o trajeto abaixo</Text>
        </View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Origem</Text>
          {isFirstDay ? (
            <PlaceAutocompleteField
              compact
              placeholder="Minha localização"
              value={toPlaceReference(day.origin)}
              onChange={onChangeOrigin}
            />
          ) : (
            <View style={styles.fixedOrigin}>
              <Text numberOfLines={2} style={styles.fixedOriginText}>
                {derivedOriginLabel}
              </Text>
            </View>
          )}
        </View>

        {day.stops.map((stop, stopIndex) => (
          <View key={stop.id} style={styles.fieldBlock}>
            <View style={styles.stopHeader}>
              <Text style={styles.fieldLabel}>Parada {stopIndex + 1}</Text>
              <Pressable
                accessibilityLabel="Remover parada"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onRemoveStop(stop.id)}
              >
                <Ionicons color="#9CA3AF" name="close" size={16} />
              </Pressable>
            </View>
            <PlaceAutocompleteField
              compact
              placeholder="Digite uma parada..."
              value={toPlaceReference(stop.place)}
              onChange={(place) => onChangeStop(stop.id, place)}
            />
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          style={styles.addStopButton}
          onPress={onAddStop}
        >
          <Ionicons color={colors.brandDark} name="add" size={16} />
          <Text style={styles.addStopText}>Adicionar parada</Text>
        </Pressable>

        <RouteDaySuggestions
          alert={daySuggestions?.alert ?? null}
          day={day}
          dayLabel={day.label}
          hasMore={daySuggestions?.hasMore ?? false}
          isLoading={isLoadingSuggestions}
          isLoadingMore={isLoadingMoreSuggestions}
          suggestions={daySuggestions?.suggestions ?? []}
          onAddSuggestion={onAddSuggestedStop}
          onLoadMore={onLoadMoreSuggestions}
          onScrollBegin={onSuggestionsScrollBegin}
          onScrollEnd={onSuggestionsScrollEnd}
        />

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Destino</Text>
          <PlaceAutocompleteField
            compact
            placeholder="Digite o destino..."
            value={toPlaceReference(day.destination)}
            onChange={onChangeDestination}
          />
        </View>

        {!isSingleDay ? (
          <Pressable
            accessibilityRole="button"
            style={styles.removeDayButton}
            onPress={onRemoveDay}
          >
            <Text style={styles.removeDayText}>Remover dia</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addStopButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  addStopText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardActive: {
    borderColor: "rgba(200, 247, 99, 0.7)",
    shadowColor: colors.brandGreen,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dayBadge: {
    alignItems: "center",
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  dayBadgeText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  daySubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
  dayTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },
  fixedOrigin: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fixedOriginText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  removeDayButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeDayText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
  stopHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
