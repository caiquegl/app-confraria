import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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

import { EmptyState } from "@/components/EmptyState";
import { toggleFavoriteEvent } from "@/pages/favorites/services/favorites.service";
import { PublicProfileEventCard } from "@/pages/public-profile-events/components/PublicProfileEventCard";
import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";
import { colors } from "@/theme/colors";

import {
  fetchEventsDiscoverList,
  type EventsDiscoverScope,
} from "../services/events-discover.service";
import {
  hasDiscoverQueryFilters,
  type EventsDiscoverQueryFilters,
} from "../utils/events-filters.utils";

type EventsDiscoverListViewProps = {
  category?: string;
  filters?: EventsDiscoverQueryFilters;
  onBack: () => void;
  onOpenEvent: (eventId: string) => void;
  scope: EventsDiscoverScope;
  title: string;
};

export function EventsDiscoverListView({
  category,
  filters,
  onBack,
  onOpenEvent,
  scope,
  title,
}: EventsDiscoverListViewProps) {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<PublicProfileEvent[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);

  const requestFilters = useMemo(() => filters, [filters]);

  const loadEvents = useCallback(async () => {
    const isRefresh = hasLoadedOnceRef.current;
    setHasError(false);
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      const response = await fetchEventsDiscoverList({
        category,
        filters: requestFilters,
        scope,
      });
      setEvents(response);
      hasLoadedOnceRef.current = true;
    } catch {
      setHasError(true);
      if (hasLoadedOnceRef.current) {
        Toast.show({
          type: "error",
          text1: "Não foi possível atualizar os eventos",
          text2: "Mantivemos a lista anterior.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, requestFilters, scope]);

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
          currentEvent.id === event.id
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
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Ionicons color={colors.brandDark} name="arrow-back" size={22} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && events.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : hasError && events.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Não foi possível carregar os eventos</Text>
          <Pressable accessibilityRole="button" style={styles.retryButton} onPress={loadEvents}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : events.length === 0 ? (
        <EmptyState
          description={
            hasDiscoverQueryFilters(filters) || category
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Ainda não há eventos nesta lista. Volte mais tarde ou explore outras categorias."
          }
          icon={hasDiscoverQueryFilters(filters) || category ? "search-outline" : "calendar-outline"}
          style={styles.emptyState}
          title="Nenhum evento encontrado"
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {events.map((event) => (
            <PublicProfileEventCard
              key={event.id}
              event={event}
              onPress={() => onOpenEvent(event.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </ScrollView>
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 0,
  },
  errorTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 22,
  },
  listContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  retryButton: {
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  title: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
});
