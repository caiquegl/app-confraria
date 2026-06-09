import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { FavoriteEventsList } from "../components/FavoriteEventsList";
import { FavoritesFeedbackCard } from "../components/FavoritesFeedbackCard";
import { FavoritesHeader } from "../components/FavoritesHeader";
import { FavoritesTabs } from "../components/FavoritesTabs";
import { fetchFavoriteEvents, toggleFavoriteEvent } from "../services/favorites.service";
import type { FavoriteEvent, FavoriteTab } from "../types/favorites.types";

type FavoritesViewProps = {
  onBack: () => void;
  onOpenEvent: (eventId: string) => void;
};

export function FavoritesView({ onBack, onOpenEvent }: FavoritesViewProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FavoriteTab>("events");
  const [events, setEvents] = useState<FavoriteEvent[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = useMemo(
    () => [
      { count: 0, key: "services" as const, label: "Serviços" },
      { count: events.length, key: "events" as const, label: "Eventos" },
      { count: 0, key: "routes" as const, label: "Rotas" },
    ],
    [events.length],
  );

  const loadFavorites = useCallback(async () => {
    setHasError(false);
    setIsLoading(true);

    try {
      const response = await fetchFavoriteEvents();
      setEvents(response);
    } catch {
      setHasError(true);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadFavorites();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadFavorites]);

  const handleToggleFavorite = useCallback(async (event: FavoriteEvent) => {
    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id ? { ...currentEvent, isFavorited: false } : currentEvent,
      ),
    );

    try {
      const response = await toggleFavoriteEvent(event.id);
      setEvents((currentEvents) =>
        response.favorited
          ? currentEvents.map((currentEvent) =>
              currentEvent.id === response.eventId
                ? { ...currentEvent, isFavorited: true }
                : currentEvent,
            )
          : currentEvents.filter((currentEvent) => currentEvent.id !== response.eventId),
      );
    } catch {
      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === event.id ? { ...currentEvent, isFavorited: true } : currentEvent,
        ),
      );
      Toast.show({
        type: "error",
        text1: "Não foi possível atualizar o favorito",
        text2: "Tente novamente em instantes.",
      });
    }
  }, []);

  return (
    <View style={styles.screen}>
      <FavoritesHeader topInset={insets.top} onBack={onBack} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FavoritesTabs activeTab={activeTab} tabs={tabs} onChangeTab={setActiveTab} />

        {activeTab === "events" ? (
          <View style={styles.section}>
            {isLoading ? (
              <FavoritesFeedbackCard
                icon="calendar-outline"
                message="Carregando eventos favoritados..."
                loading
              />
            ) : null}

            {hasError ? (
              <FavoritesFeedbackCard
                icon="alert-circle-outline"
                message="Não foi possível carregar seus favoritos."
              />
            ) : null}

            {!isLoading && !hasError && events.length === 0 ? (
              <FavoritesFeedbackCard
                icon="calendar-clear-outline"
                message="Nenhum evento favoritado"
              />
            ) : null}

            {!isLoading && !hasError && events.length > 0 ? (
              <FavoriteEventsList
                events={events}
                onOpenEvent={onOpenEvent}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.section}>
            <FavoritesFeedbackCard
              icon={activeTab === "services" ? "construct-outline" : "map-outline"}
              message={
                activeTab === "services"
                  ? "Nenhum serviço favoritado"
                  : "Nenhuma rota favoritada"
              }
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  section: {
    marginTop: 22,
  },
});
