import { useCallback, useState } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";

import type { PlaceReference } from "@/lib/places";
import type { RouteDaySuggestionsResponse, RouteStopSuggestion } from "@/lib/places";

import { RouteDayCard } from "./RouteDayCard";
import type { RouteDraftDay } from "../types/route-create.types";

type RouteDayCarouselProps = {
  activeDayId: string;
  days: RouteDraftDay[];
  getDaySuggestions: (dayId: string) => RouteDaySuggestionsResponse | null;
  isLoadingMoreForDay: (dayId: string) => boolean;
  isLoadingSuggestions: boolean;
  onAddStop: (dayId: string) => void;
  onAddSuggestedStop: (dayId: string, suggestion: RouteStopSuggestion) => void;
  onLoadMoreSuggestions: (dayId: string) => void;
  onChangeDayDestination: (dayId: string, place: PlaceReference | null) => void;
  onChangeDayOrigin: (dayId: string, place: PlaceReference | null) => void;
  onChangeStop: (dayId: string, stopId: string, place: PlaceReference | null) => void;
  onRemoveDay: (dayId: string) => void;
  onRemoveStop: (dayId: string, stopId: string) => void;
  onSelectDay: (dayId: string) => void;
  onToggleDayOvernight: (dayId: string) => void;
};

const CARD_GAP = 16;
const PEEK_WIDTH = 32;

export function RouteDayCarousel({
  activeDayId,
  days,
  getDaySuggestions,
  isLoadingMoreForDay,
  isLoadingSuggestions,
  onAddStop,
  onAddSuggestedStop,
  onLoadMoreSuggestions,
  onChangeDayDestination,
  onChangeDayOrigin,
  onChangeStop,
  onRemoveDay,
  onRemoveStop,
  onSelectDay,
  onToggleDayOvernight,
}: RouteDayCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [lockDayCarousel, setLockDayCarousel] = useState(false);
  const isSingleDay = days.length === 1;
  const cardWidth = isSingleDay ? screenWidth - 48 : screenWidth - 48 - PEEK_WIDTH;

  const handleSuggestionsScrollBegin = useCallback(() => {
    setLockDayCarousel(true);
  }, []);

  const handleSuggestionsScrollEnd = useCallback(() => {
    setLockDayCarousel(false);
  }, []);

  return (
    <View>
      <FlatList
        horizontal
        data={days}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        scrollEnabled={!lockDayCarousel}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={cardWidth + CARD_GAP}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <RouteDayCard
            day={item}
            dayIndex={index}
            days={days}
            daySuggestions={getDaySuggestions(item.id)}
            isActive={item.id === activeDayId}
            isFirstDay={index === 0}
            isLoadingSuggestions={isLoadingSuggestions}
            isLoadingMoreSuggestions={isLoadingMoreForDay(item.id)}
            isSingleDay={isSingleDay}
            width={cardWidth}
            onAddStop={() => onAddStop(item.id)}
            onAddSuggestedStop={(suggestion) => onAddSuggestedStop(item.id, suggestion)}
            onLoadMoreSuggestions={() => onLoadMoreSuggestions(item.id)}
            onChangeDestination={(place) => onChangeDayDestination(item.id, place)}
            onChangeOrigin={(place) => onChangeDayOrigin(item.id, place)}
            onChangeStop={(stopId, place) => onChangeStop(item.id, stopId, place)}
            onPress={() => onSelectDay(item.id)}
            onRemoveDay={() => onRemoveDay(item.id)}
            onRemoveStop={(stopId) => onRemoveStop(item.id, stopId)}
            onSuggestionsScrollBegin={handleSuggestionsScrollBegin}
            onSuggestionsScrollEnd={handleSuggestionsScrollEnd}
            onToggleOvernight={() => onToggleDayOvernight(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 24,
  },
  separator: {
    width: 16,
  },
});
