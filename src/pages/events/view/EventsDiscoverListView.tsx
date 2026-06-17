import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { toggleFavoriteEvent } from "@/pages/favorites/services/favorites.service";
import { PublicProfileEventCard } from "@/pages/public-profile-events/components/PublicProfileEventCard";
import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";
import { colors } from "@/theme/colors";

import {
  fetchEventsDiscoverList,
  type EventsDiscoverScope,
} from "../services/events-discover.service";

type EventsDiscoverListViewProps = {
  category?: string;
  onBack: () => void;
  onOpenEvent: (eventId: string) => void;
  scope: EventsDiscoverScope;
  title: string;
};

export function EventsDiscoverListView({
  category,
  onBack,
  onOpenEvent,
  scope,
  title,
}: EventsDiscoverListViewProps) {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<PublicProfileEvent[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setHasError(false);
    setIsLoading(true);

    try {
      const response = await fetchEventsDiscoverList({ category, scope });
      setEvents(response);
    } catch {
      setEvents([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [category, scope]);

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
    }, [loadEvents]),
  );

  const handleToggleFavorite = useCallback(async (event: PublicProfileEvent) => {
    const nextFavorited = !event.isFavorited;

    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id
          ? { ...currentEvent, isFavorited: nextFavorited }
          : currentEvent,
      ),
    );

    try {
      const response = await toggleFavoriteEvent(event.id);
      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === response.eventId
            ? { ...currentEvent, isFavorited: response.favorited }
            : currentEvent,
        ),
      );
    } catch {
      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === event.id
            ? { ...currentEvent, isFavorited: event.isFavorited }
            : currentEvent,
        ),
      );
      Toast.show({
        type: "error",
        text1: "Não foi possível atualizar o favorito",
      });
    }
  }, []);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : null}

      {!isLoading && hasError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Não foi possível carregar os eventos.</Text>
        </View>
      ) : null}

      {!isLoading && !hasError && events.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
          <Text style={styles.emptyText}>Volte em breve para ver novidades nesta seção.</Text>
        </View>
      ) : null}

      {!isLoading && !hasError && events.length > 0 ? (
        <ScrollView
          contentContainerStyle={{
            gap: 14,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {events.map((event) => (
            <PublicProfileEventCard
              key={event.id}
              event={event}
              onPress={(selectedEvent) => onOpenEvent(selectedEvent.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});
