import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import {
  NestableDraggableFlatList,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import type { RenderItemParams } from "react-native-draggable-flatlist";

import { PlaceAutocompleteField } from "@/components/PlaceAutocompleteField";
import type {
  PlaceReference,
  RouteDaySuggestionsResponse,
  RouteStopSuggestion,
} from "@/lib/places";
import { colors } from "@/theme/colors";

import type { RouteDraftDay, RoutePlace } from "../types/route-create.types";
import { RouteDaySuggestions } from "./RouteDaySuggestions";
import { getDayColor } from "../utils/route-day.utils";
import {
  DESTINATION_WAYPOINT_ID,
  getDayOriginLabel,
  ORIGIN_WAYPOINT_ID,
  type RouteWaypointOrderItem,
} from "../utils/route-draft.utils";
import { toPlaceReference } from "../utils/route-place.utils";

type WaypointRow = {
  id: string;
  kind: "destination" | "origin" | "stop";
  place: RoutePlace | null;
};

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
  onDragBegin?: () => void;
  onDragEnd?: () => void;
  onPress: () => void;
  onRemoveDay: () => void;
  onRemoveStop: (stopId: string) => void;
  onReorderWaypoints: (orderedItems: RouteWaypointOrderItem[]) => void;
  onSuggestionsScrollBegin?: () => void;
  onSuggestionsScrollEnd?: () => void;
  onToggleOvernight: () => void;
  width: number;
};

function getWaypointLabel(
  index: number,
  total: number,
  isFirstDay: boolean,
): string {
  if (isFirstDay && index === 0) {
    return "Origem";
  }
  if (index === total - 1) {
    return "Destino";
  }
  const stopNumber = isFirstDay ? index : index + 1;
  return `Parada ${stopNumber}`;
}

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
  onDragBegin,
  onDragEnd,
  onPress,
  onRemoveDay,
  onRemoveStop,
  onReorderWaypoints,
  onSuggestionsScrollBegin,
  onSuggestionsScrollEnd,
  onToggleOvernight,
  width,
}: RouteDayCardProps) {
  const dayColor = getDayColor(dayIndex);
  const derivedOriginLabel = getDayOriginLabel(days, dayIndex);
  const [isReordering, setIsReordering] = useState(false);

  const sortableData = useMemo((): WaypointRow[] => {
    const stops: WaypointRow[] = day.stops.map((stop) => ({
      id: stop.id,
      kind: "stop",
      place: stop.place,
    }));

    if (isFirstDay) {
      return [
        { id: ORIGIN_WAYPOINT_ID, kind: "origin", place: day.origin },
        ...stops,
        {
          id: DESTINATION_WAYPOINT_ID,
          kind: "destination",
          place: day.destination,
        },
      ];
    }

    return [
      ...stops,
      {
        id: DESTINATION_WAYPOINT_ID,
        kind: "destination",
        place: day.destination,
      },
    ];
  }, [day.destination, day.origin, day.stops, isFirstDay]);

  const handlePlaceChange = useCallback(
    (item: WaypointRow, index: number, place: PlaceReference | null) => {
      const total = sortableData.length;
      const isOrigin = isFirstDay && index === 0;
      const isDestination = index === total - 1;

      if (isOrigin) {
        onChangeOrigin(place);
        return;
      }
      if (isDestination) {
        onChangeDestination(place);
        return;
      }
      onChangeStop(item.id, place);
    },
    [
      isFirstDay,
      onChangeDestination,
      onChangeOrigin,
      onChangeStop,
      sortableData.length,
    ],
  );

  const renderWaypoint = useCallback(
    ({ item, drag, getIndex, isActive: isDragging }: RenderItemParams<WaypointRow>) => {
      const index = getIndex() ?? 0;
      const total = sortableData.length;
      const label = getWaypointLabel(index, total, isFirstDay);
      const isStopRow =
        !(isFirstDay && index === 0) && index !== total - 1;
      const canRemove = isStopRow && item.kind === "stop";

      return (
        <ScaleDecorator>
          <View style={[styles.fieldBlock, isDragging && styles.fieldBlockDragging]}>
            <View style={styles.stopHeader}>
              <Text style={styles.fieldLabel}>{label}</Text>
              {canRemove ? (
                <Pressable
                  accessibilityLabel="Remover parada"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onRemoveStop(item.id)}
                >
                  <Ionicons color="#9CA3AF" name="close" size={16} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputFlex}>
                <PlaceAutocompleteField
                  compact
                  editable={!isReordering}
                  placeholder={
                    isFirstDay && index === 0
                      ? "Minha localização"
                      : index === total - 1
                        ? "Digite o destino..."
                        : "Digite uma parada..."
                  }
                  suppressSuggestions={isReordering}
                  value={toPlaceReference(item.place)}
                  onChange={(place) => handlePlaceChange(item, index, place)}
                />
              </View>
              <Pressable
                accessibilityLabel="Arrastar ponto"
                accessibilityRole="button"
                hitSlop={8}
                style={[styles.dragHandle, isDragging && styles.dragHandleActive]}
                onPressIn={() => {
                  Keyboard.dismiss();
                  drag();
                }}
              >
                <Ionicons color="#9CA3AF" name="menu" size={20} />
              </Pressable>
            </View>
          </View>
        </ScaleDecorator>
      );
    },
    [
      handlePlaceChange,
      isFirstDay,
      isReordering,
      onRemoveStop,
      sortableData.length,
    ],
  );

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
        {!isFirstDay ? (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Origem</Text>
            <View style={styles.fixedOrigin}>
              <Text numberOfLines={2} style={styles.fixedOriginText}>
                {derivedOriginLabel}
              </Text>
            </View>
          </View>
        ) : null}

        <NestableDraggableFlatList
          activationDistance={8}
          data={sortableData}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
          renderItem={renderWaypoint}
          onDragBegin={() => {
            Keyboard.dismiss();
            setIsReordering(true);
            onDragBegin?.();
          }}
          onDragEnd={({ data }) => {
            setIsReordering(false);
            onDragEnd?.();
            onReorderWaypoints(
              data.map((row) => ({ id: row.id, place: row.place })),
            );
          }}
        />

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

        <View style={styles.dayActions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.overnightButton, day.overnight && styles.overnightButtonActive]}
            onPress={onToggleOvernight}
          >
            <Ionicons
              color={day.overnight ? "#4E73D9" : "#6B7280"}
              name="moon-outline"
              size={12}
            />
            <Text
              style={[
                styles.overnightButtonText,
                day.overnight && styles.overnightButtonTextActive,
              ]}
            >
              Marcar pernoite
            </Text>
          </Pressable>

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
  dayActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 4,
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
  dragHandle: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    width: 40,
  },
  dragHandleActive: {
    backgroundColor: "#E5E7EB",
  },
  fieldBlock: {
    gap: 8,
    marginBottom: 16,
  },
  fieldBlockDragging: {
    opacity: 0.95,
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
  inputFlex: {
    flex: 1,
  },
  inputRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  overnightButton: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overnightButtonActive: {
    backgroundColor: "#EEF4FF",
  },
  overnightButtonText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },
  overnightButtonTextActive: {
    color: "#4E73D9",
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
