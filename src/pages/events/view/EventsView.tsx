import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { getCurrentUserId } from "@/lib/auth";
import {
  getStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { fetchEventCategories } from "@/pages/event-create/services/event-create.service";
import { toggleFavoriteEvent } from "@/pages/favorites/services/favorites.service";
import { useNotificationBadge } from "@/pages/notifications";
import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";
import { fetchActiveQuickRides } from "@/pages/quick-rides/services/quick-rides.service";
import type { QuickRide } from "@/pages/quick-rides/types/quick-ride.types";
import { isQuickRideDiscoverable } from "@/pages/quick-rides/types/quick-ride.types";
import { colors } from "@/theme/colors";

import { EventsCategoryPills } from "../components/EventsCategoryPills";
import { EventsCreateActionSheet } from "../components/EventsCreateActionSheet";
import { EventsCreateFab } from "../components/EventsCreateFab";
import { EventsEmptyFiltersCard } from "../components/EventsEmptyFiltersCard";
import { EventsFilterChips } from "../components/EventsFilterChips";
import { EventsHeaderSection } from "../components/EventsHeaderSection";
import { EventsLocationGate } from "../components/EventsLocationGate";
import { EventsSection } from "../components/EventsSection";
import { EventsTopBar } from "../components/EventsTopBar";
import { QuickRidesSection } from "../components/QuickRidesSection";
import {
  fetchEventsDiscoverList,
  fetchEventsDiscoverSections,
  type EventsDiscoverCategorySection,
  type EventsDiscoverScope,
} from "../services/events-discover.service";
import { useEventsLocation } from "../hooks/useEventsLocation";
import type { EventsFilterChip } from "../types/events.types";

const DISCOVER_SECTION_PREVIEW_LIMIT = 10;

export function EventsView() {
  const insets = useSafeAreaInsets();
  const { hasUnread } = useNotificationBadge();
  const { location, requestPermission } = useEventsLocation();
  const storedProfile = getStoredCurrentProfile();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tudo");
  const [categories, setCategories] = useState<string[]>([]);
  const [activeFilterChips] = useState<EventsFilterChip[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(storedProfile.avatar);
  const [userName, setUserName] = useState<string>(storedProfile.name ?? "Perfil");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [quickRides, setQuickRides] = useState<QuickRide[]>([]);
  const [thisWeekEvents, setThisWeekEvents] = useState<PublicProfileEvent[]>([]);
  const [thisMonthEvents, setThisMonthEvents] = useState<PublicProfileEvent[]>([]);
  const [categorySections, setCategorySections] = useState<EventsDiscoverCategorySection[]>([]);
  const [categoryFilteredEvents, setCategoryFilteredEvents] = useState<PublicProfileEvent[]>([]);
  const [isLoadingCategoryEvents, setIsLoadingCategoryEvents] = useState(false);
  const isMountedRef = useRef(true);

  const isCategoryFilterActive = selectedCategory !== "Tudo";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadQuickRides = useCallback(() => {
    if (location.status !== "ready" || !location.city) {
      return;
    }

    void fetchActiveQuickRides({
      city: location.city,
      region: location.region,
    })
      .then((rides) => {
        if (isMountedRef.current) {
          setQuickRides(rides);
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setQuickRides([]);
        }
      });
  }, [location.city, location.region, location.status]);

  const loadDiscoverSections = useCallback(() => {
    void fetchEventsDiscoverSections()
      .then((sections) => {
        if (!isMountedRef.current) return;
        setThisWeekEvents(sections.thisWeek);
        setThisMonthEvents(sections.thisMonth);
        setCategorySections(sections.categories);
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setThisWeekEvents([]);
        setThisMonthEvents([]);
        setCategorySections([]);
      });
  }, []);

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setUserAvatar(profile.avatar);
      setUserName(profile.name ?? "Perfil");
    });
  }, []);

  useEffect(() => {
    void fetchEventCategories()
      .then((items) => setCategories(items.map((item) => item.name)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (location.status !== "ready" || !location.city) {
      return;
    }

    loadQuickRides();
  }, [loadQuickRides, location.city, location.status]);

  useFocusEffect(
    useCallback(() => {
      loadQuickRides();
      loadDiscoverSections();
    }, [loadDiscoverSections, loadQuickRides]),
  );

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);

    if (category === "Tudo") {
      return;
    }

    setIsLoadingCategoryEvents(true);

    void fetchEventsDiscoverList({
      category,
      scope: "category",
    })
      .then((events) => {
        if (isMountedRef.current) {
          setCategoryFilteredEvents(events);
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setCategoryFilteredEvents([]);
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoadingCategoryEvents(false);
        }
      });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    handleCategoryChange("Tudo");
  }, [handleCategoryChange]);

  const handleOpenFilters = useCallback(() => {
    Toast.show({
      type: "info",
      text1: "Filtros em breve",
    });
  }, []);

  const handleCreateEvent = useCallback(() => {
    setCreateSheetOpen(false);

    void getCurrentUserId().then((userId) => {
      if (!userId) {
        Toast.show({
          type: "error",
          text1: "Não foi possível abrir a criação de evento",
        });
        return;
      }

      router.push({
        pathname: "/users/[userId]/events/create",
        params: { userId },
      });
    });
  }, []);

  const handleCreateQuickRide = useCallback(() => {
    setCreateSheetOpen(false);
    router.push("/quick-rides/create");
  }, []);

  const handleOpenMyQuickRides = useCallback(() => {
    setCreateSheetOpen(false);
    router.push("/quick-rides/mine");
  }, []);

  const handleQuickRidePress = useCallback((ride: QuickRide) => {
    router.push({
      pathname: "/quick-rides/[quickRideId]",
      params: { quickRideId: ride.id },
    });
  }, []);

  const handleEventPress = useCallback((event: PublicProfileEvent) => {
    router.push({
      pathname: "/event/[eventId]",
      params: { eventId: event.id },
    });
  }, []);

  const handleOpenDiscoverList = useCallback(
    (scope: EventsDiscoverScope, title: string, category?: string) => {
      router.push({
        pathname: "/events/discover",
        params: {
          category: category ?? "",
          scope,
          title,
        },
      });
    },
    [],
  );

  const updateFavoriteState = useCallback(
    (eventId: string, isFavorited: boolean) => {
      const mapEvents = (events: PublicProfileEvent[]) =>
        events.map((event) => (event.id === eventId ? { ...event, isFavorited } : event));

      setThisWeekEvents((current) => mapEvents(current));
      setThisMonthEvents((current) => mapEvents(current));
      setCategorySections((current) =>
        current.map((section) => ({
          ...section,
          events: mapEvents(section.events),
        })),
      );
      setCategoryFilteredEvents((current) => mapEvents(current));
    },
    [],
  );

  const handleToggleFavorite = useCallback(
    async (event: PublicProfileEvent) => {
      const previousFavorited = event.isFavorited;
      updateFavoriteState(event.id, !previousFavorited);

      try {
        const response = await toggleFavoriteEvent(event.id);
        updateFavoriteState(response.eventId, response.favorited);
      } catch {
        updateFavoriteState(event.id, previousFavorited);
        Toast.show({
          type: "error",
          text1: "Não foi possível atualizar o favorito",
        });
      }
    },
    [updateFavoriteState],
  );

  const displayedQuickRides =
    !isCategoryFilterActive && location.status === "ready" && location.city
      ? quickRides.filter((ride) => isQuickRideDiscoverable(ride))
      : [];

  const displayedCategoryEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return categoryFilteredEvents;
    }

    return categoryFilteredEvents.filter((event) =>
      [event.title, event.category, event.location, event.organizer, event.date].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [categoryFilteredEvents, searchQuery]);

  const displayedCategoryPreview = useMemo(
    () => displayedCategoryEvents.slice(0, DISCOVER_SECTION_PREVIEW_LIMIT),
    [displayedCategoryEvents],
  );

  if (location.status !== "ready" || !location.cityLabel) {
    return (
      <EventsLocationGate
        canAskAgain={location.canAskAgain}
        status={location.status}
        onRequestPermission={() => void requestPermission()}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 96 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <EventsTopBar
          hasUnreadNotifications={hasUnread}
          locationLabel={location.cityLabel}
          searchQuery={searchQuery}
          topInset={insets.top}
          userAvatar={userAvatar}
          userName={userName}
          onOpenNotifications={() => router.push("/notifications")}
          onOpenProfile={() => router.push("/profile")}
          onSearchChange={setSearchQuery}
        />

        <EventsHeaderSection
          activeFiltersCount={activeFilterChips.length}
          onOpenFilters={handleOpenFilters}
        />

        <EventsFilterChips chips={activeFilterChips} onClearAll={clearAllFilters} />

        <EventsCategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onChange={handleCategoryChange}
        />

        {isCategoryFilterActive ? (
          isLoadingCategoryEvents || displayedCategoryEvents.length === 0 ? (
            <EventsEmptyFiltersCard
              isLoading={isLoadingCategoryEvents}
              onClearFilters={clearAllFilters}
            />
          ) : (
            <EventsSection
              events={displayedCategoryPreview}
              title={selectedCategory}
              onEventPress={handleEventPress}
              onSeeMore={() =>
                handleOpenDiscoverList("category", selectedCategory, selectedCategory)
              }
              onToggleFavorite={handleToggleFavorite}
            />
          )
        ) : (
          <>
            <EventsSection
              events={thisWeekEvents}
              subtitle="Eventos nos próximos 7 dias"
              title="Esta semana"
              onEventPress={handleEventPress}
              onSeeMore={() => handleOpenDiscoverList("this_week", "Esta semana")}
              onToggleFavorite={handleToggleFavorite}
            />

            <QuickRidesSection rides={displayedQuickRides} onRidePress={handleQuickRidePress} />

            <EventsSection
              events={thisMonthEvents}
              title="Encontros do mês"
              onEventPress={handleEventPress}
              onSeeMore={() => handleOpenDiscoverList("this_month", "Encontros do mês")}
              onToggleFavorite={handleToggleFavorite}
            />

            {categorySections.map((section) => (
              <EventsSection
                key={section.category}
                events={section.events}
                title={section.category}
                onEventPress={handleEventPress}
                onSeeMore={() =>
                  handleOpenDiscoverList("category", section.category, section.category)
                }
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </>
        )}
      </ScrollView>

      <EventsCreateFab onPress={() => setCreateSheetOpen(true)} />

      <EventsCreateActionSheet
        visible={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreateEvent={handleCreateEvent}
        onCreateQuickRide={handleCreateQuickRide}
        onOpenMyQuickRides={handleOpenMyQuickRides}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});
