import { StyleSheet, View } from "react-native";

import { PublicProfileEventCard } from "@/pages/public-profile-events/components/PublicProfileEventCard";
import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";

export const EVENTS_DISCOVER_CARD_WIDTH = 256;

type EventsDiscoverCardProps = {
  event: PublicProfileEvent;
  onPress: (event: PublicProfileEvent) => void;
  onToggleFavorite?: (event: PublicProfileEvent) => void;
};

export function EventsDiscoverCard({ event, onPress, onToggleFavorite }: EventsDiscoverCardProps) {
  return (
    <View style={styles.cardWrap}>
      <PublicProfileEventCard event={event} onPress={onPress} onToggleFavorite={onToggleFavorite} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    width: EVENTS_DISCOVER_CARD_WIDTH,
  },
});
