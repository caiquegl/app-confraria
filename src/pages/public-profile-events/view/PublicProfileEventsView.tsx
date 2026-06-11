import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { CreatePublicProfileEventCard } from "../components/CreatePublicProfileEventCard";
import { PublicProfileEventCard } from "../components/PublicProfileEventCard";
import { PublicProfileEventsEmptyState } from "../components/PublicProfileEventsEmptyState";
import { PublicProfileEventsHeader } from "../components/PublicProfileEventsHeader";
import { PublicProfileEventsTabs } from "../components/PublicProfileEventsTabs";
import { PublicProfileEventTag } from "../components/PublicProfileEventTag";
import {
  fetchCreatedPublicProfileEvents,
  fetchJoinedPublicProfileEvents,
  getMockPublicProfileEvents,
  PUBLIC_PROFILE_EVENT_TABS,
  togglePublicProfileEventFavorite,
} from "../services/public-profile-events.service";
import type {
  PublicProfileEvent,
  PublicProfileEventTab,
} from "../types/public-profile-events.types";

type PublicProfileEventsViewProps = {
  avatarUrl?: string | null;
  onBack: () => void;
  onAvatarPress: () => void;
  onCreateEvent: () => void;
  onOpenCreatedEvent: (eventId: string) => void;
  onOpenEvent: (eventId: string) => void;
  userId: string;
};

export function PublicProfileEventsView({
  avatarUrl,
  onAvatarPress,
  onBack,
  onCreateEvent,
  onOpenCreatedEvent,
  onOpenEvent,
  userId,
}: PublicProfileEventsViewProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PublicProfileEventTab>("Criados");
  const [createdEvents, setCreatedEvents] = useState<PublicProfileEvent[]>([]);
  const [createdEventsError, setCreatedEventsError] = useState(false);
  const [isLoadingCreatedEvents, setIsLoadingCreatedEvents] = useState(true);
  const [isLoadingJoinedEvents, setIsLoadingJoinedEvents] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<PublicProfileEvent[]>([]);
  const [joinedEventsError, setJoinedEventsError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCreatedEvents = useCallback(async (query?: string) => {
    if (!userId) {
      setCreatedEvents([]);
      setIsLoadingCreatedEvents(false);
      return;
    }

    setCreatedEventsError(false);
    setIsLoadingCreatedEvents(true);

    try {
      const response = await fetchCreatedPublicProfileEvents(userId, query);
      setCreatedEvents(response);
    } catch {
      setCreatedEventsError(true);
      setCreatedEvents([]);
    } finally {
      setIsLoadingCreatedEvents(false);
    }
  }, [userId]);

  const loadJoinedEvents = useCallback(async (query?: string) => {
    if (!userId) {
      setJoinedEvents([]);
      setIsLoadingJoinedEvents(false);
      return;
    }

    setJoinedEventsError(false);
    setIsLoadingJoinedEvents(true);

    try {
      const response = await fetchJoinedPublicProfileEvents(userId, query);
      setJoinedEvents(response);
    } catch {
      setJoinedEventsError(true);
      setJoinedEvents([]);
    } finally {
      setIsLoadingJoinedEvents(false);
    }
  }, [userId]);

  useEffect(() => {
    const normalizedSearch = searchQuery.trim();
    const timeoutId = setTimeout(() => {
      void loadCreatedEvents(normalizedSearch || undefined);
      void loadJoinedEvents(normalizedSearch || undefined);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [loadCreatedEvents, loadJoinedEvents, searchQuery]);

  const handleToggleFavorite = useCallback(async (event: PublicProfileEvent) => {
    const setOptimisticFavorite = (isFavorited: boolean) => {
      setCreatedEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === event.id ? { ...currentEvent, isFavorited } : currentEvent,
        ),
      );
      setJoinedEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === event.id ? { ...currentEvent, isFavorited } : currentEvent,
        ),
      );
    };

    setOptimisticFavorite(!event.isFavorited);

    try {
      const response = await togglePublicProfileEventFavorite(event.id);
      setOptimisticFavorite(response.favorited);
    } catch {
      setOptimisticFavorite(event.isFavorited);
      Toast.show({
        type: "error",
        text1: "Não foi possível atualizar o favorito",
        text2: "Tente novamente em instantes.",
      });
    }
  }, []);

  const events = useMemo(
    () => {
      if (activeTab === "Criados") return createdEvents;
      if (activeTab === "Inscrito") return joinedEvents;
      return filterEventsBySearch(getMockPublicProfileEvents(activeTab), searchQuery);
    },
    [activeTab, createdEvents, joinedEvents, searchQuery],
  );
  const shouldShowLoading =
    (activeTab === "Criados" && isLoadingCreatedEvents) ||
    (activeTab === "Inscrito" && isLoadingJoinedEvents);
  const shouldShowError =
    (activeTab === "Criados" && createdEventsError) ||
    (activeTab === "Inscrito" && joinedEventsError);
  const shouldShowEmpty = !shouldShowLoading && !shouldShowError && events.length === 0;

  return (
    <View style={styles.screen}>
      <PublicProfileEventsHeader
        avatarUrl={avatarUrl}
        searchQuery={searchQuery}
        topInset={insets.top}
        onAvatarPress={onAvatarPress}
        onBack={onBack}
        onSearchChange={setSearchQuery}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Meus Eventos</Text>
        </View>

        <PublicProfileEventsTabs
          activeTab={activeTab}
          tabs={PUBLIC_PROFILE_EVENT_TABS}
          onChangeTab={setActiveTab}
        />

        <View style={styles.section}>
          {activeTab === "Criados" ? (
            <CreatePublicProfileEventCard onPress={onCreateEvent} />
          ) : null}

          <Text style={styles.sectionTitle}>{getSectionTitle(activeTab)}</Text>

          {shouldShowLoading ? (
            <View style={styles.feedbackCard}>
              <ActivityIndicator color={colors.brandPrimary} />
              <Text style={styles.feedbackText}>Carregando eventos...</Text>
            </View>
          ) : null}

          {shouldShowError ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>Não foi possível carregar seus eventos</Text>
              <Text style={styles.feedbackText}>Tente abrir a página novamente em instantes.</Text>
            </View>
          ) : null}

          {!shouldShowLoading && !shouldShowError && events.length > 0 ? (
            <View style={styles.eventsList}>
              {events.map((event, index) => {
                const primaryBadge = getPrimaryEventBadge(event, activeTab, index);

                return (
                  <View key={event.id} style={styles.eventBlock}>
                    <View style={styles.tagsRow}>
                      <PublicProfileEventTag
                        active
                        icon={primaryBadge.icon}
                        label={primaryBadge.label}
                      />
                      <PublicProfileEventTag icon="trail-sign-outline" label={event.category} />
                    </View>
                    <PublicProfileEventCard
                      event={event}
                      onPress={(selectedEvent) => {
                        if (activeTab === "Criados") {
                          onOpenCreatedEvent(selectedEvent.id);
                          return;
                        }

                        onOpenEvent(selectedEvent.id);
                      }}
                      onToggleFavorite={
                        activeTab === "Visitados" ? undefined : handleToggleFavorite
                      }
                    />
                  </View>
                );
              })}
            </View>
          ) : null}

          {shouldShowEmpty ? (
            <PublicProfileEventsEmptyState />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function filterEventsBySearch(events: PublicProfileEvent[], searchQuery: string) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  if (!normalizedSearch) return events;

  return events.filter((event) =>
    [event.title, event.category, event.location, event.organizer, event.date].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
}

function getPrimaryEventBadge(
  event: PublicProfileEvent,
  tab: PublicProfileEventTab,
  eventIndex: number,
): { icon: "calendar-outline" | "star"; label: string } {
  if (tab === "Visitados") {
    return event.isLatestVisit || eventIndex === 0
      ? { icon: "star", label: "Último evento" }
      : { icon: "calendar-outline", label: event.date };
  }

  if (isEventToday(event.startsAt)) {
    return { icon: "star", label: "Em andamento" };
  }

  return { icon: "calendar-outline", label: event.date };
}

function isEventToday(dateValue: string) {
  const eventDate = new Date(dateValue);
  const today = new Date();

  return (
    eventDate.getFullYear() === today.getFullYear() &&
    eventDate.getMonth() === today.getMonth() &&
    eventDate.getDate() === today.getDate()
  );
}

function getSectionTitle(tab: PublicProfileEventTab) {
  switch (tab) {
    case "Inscrito":
      return "Eventos que participa";
    case "Visitados":
      return "Eventos visitados";
    case "Criados":
    default:
      return "Meus eventos criados";
  }
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  eventsList: {
    gap: 14,
  },
  eventBlock: {
    gap: 10,
  },
  feedbackCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 24,
  },
  feedbackText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
  feedbackTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 20,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    color: colors.brandDark,
    fontSize: 26,
    fontWeight: "900",
  },
  titleBlock: {
    marginTop: 4,
  },
});
