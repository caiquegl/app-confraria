import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";

import type { PlaceReference } from "@/lib/places";

import { RouteDayCard } from "./RouteDayCard";
import type { RouteDraftDay } from "../types/route-create.types";

type RouteDayCarouselProps = {
  activeDayId: string;
  days: RouteDraftDay[];
  onAddStop: (dayId: string) => void;
  onChangeDayDestination: (dayId: string, place: PlaceReference | null) => void;
  onChangeDayOrigin: (dayId: string, place: PlaceReference | null) => void;
  onChangeStop: (dayId: string, stopId: string, place: PlaceReference | null) => void;
  onRemoveDay: (dayId: string) => void;
  onRemoveStop: (dayId: string, stopId: string) => void;
  onSelectDay: (dayId: string) => void;
};

const CARD_GAP = 16;
const PEEK_WIDTH = 32;

export function RouteDayCarousel({
  activeDayId,
  days,
  onAddStop,
  onChangeDayDestination,
  onChangeDayOrigin,
  onChangeStop,
  onRemoveDay,
  onRemoveStop,
  onSelectDay,
}: RouteDayCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isSingleDay = days.length === 1;
  const cardWidth = isSingleDay ? screenWidth - 48 : screenWidth - 48 - PEEK_WIDTH;

  return (
    <View>
      <FlatList
        horizontal
        data={days}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
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
            isActive={item.id === activeDayId}
            isFirstDay={index === 0}
            isSingleDay={isSingleDay}
            width={cardWidth}
            onAddStop={() => onAddStop(item.id)}
            onChangeDestination={(place) => onChangeDayDestination(item.id, place)}
            onChangeOrigin={(place) => onChangeDayOrigin(item.id, place)}
            onChangeStop={(stopId, place) => onChangeStop(item.id, stopId, place)}
            onPress={() => onSelectDay(item.id)}
            onRemoveDay={() => onRemoveDay(item.id)}
            onRemoveStop={(stopId) => onRemoveStop(item.id, stopId)}
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
