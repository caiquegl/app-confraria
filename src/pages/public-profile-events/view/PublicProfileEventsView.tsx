import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { CreatePublicProfileEventCard } from "../components/CreatePublicProfileEventCard";
import { PublicProfileEventCard } from "../components/PublicProfileEventCard";
import { PublicProfileEventsEmptyState } from "../components/PublicProfileEventsEmptyState";
import { PublicProfileEventsHeader } from "../components/PublicProfileEventsHeader";
import { PublicProfileEventsTabs } from "../components/PublicProfileEventsTabs";
import { PublicProfileEventTag } from "../components/PublicProfileEventTag";
import {
  getMockPublicProfileEvents,
  PUBLIC_PROFILE_EVENT_TABS,
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
};

export function PublicProfileEventsView({
  avatarUrl,
  onAvatarPress,
  onBack,
  onCreateEvent,
}: PublicProfileEventsViewProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PublicProfileEventTab>("Criados");
  const [searchQuery, setSearchQuery] = useState("");

  const events = useMemo(() => getMockPublicProfileEvents(activeTab), [activeTab]);
  const filteredEvents = useMemo(
    () => filterEventsBySearch(events, searchQuery),
    [events, searchQuery],
  );

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

          {activeTab === "Criados" || filteredEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {filteredEvents.map((event, index) => {
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
                    <PublicProfileEventCard event={event} />
                  </View>
                );
              })}
            </View>
          ) : (
            <PublicProfileEventsEmptyState />
          )}
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
