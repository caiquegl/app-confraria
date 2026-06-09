import { StyleSheet, View } from "react-native";

import { PublicProfileEventCard } from "@/pages/public-profile-events/components/PublicProfileEventCard";

import type { FavoriteEvent } from "../types/favorites.types";

type FavoriteEventsListProps = {
  events: FavoriteEvent[];
  onOpenEvent: (eventId: string) => void;
  onToggleFavorite: (event: FavoriteEvent) => void;
};

export function FavoriteEventsList({
  events,
  onOpenEvent,
  onToggleFavorite,
}: FavoriteEventsListProps) {
  return (
    <View style={styles.eventsList}>
      {events.map((event) => (
        <PublicProfileEventCard
          key={event.id}
          event={event}
          onPress={(selectedEvent) => onOpenEvent(selectedEvent.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  eventsList: {
    gap: 14,
  },
});
