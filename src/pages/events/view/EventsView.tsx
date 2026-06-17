import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { EventsFiltersSheet } from "../components/EventsFiltersSheet";
import { EventsHeaderSection } from "../components/EventsHeaderSection";
import { EventsLocationGate } from "../components/EventsLocationGate";
import { EventsSection } from "../components/EventsSection";
import { EventsTopBar } from "../components/EventsTopBar";
import { QuickRidesSection } from "../components/QuickRidesSection";
import { useEventsLocation } from "../hooks/useEventsLocation";
import {
  fetchEventsDiscoverList,
  fetchEventsDiscoverSections,
  type EventsDiscoverCategorySection,
  type EventsDiscoverScope,
} from "../services/events-discover.service";
import {
  DEFAULT_EVENTS_FILTERS,
  type EventsFilters,
} from "../types/events-filters.types";
import {
  buildActiveFilterChips,
  buildDiscoverQueryFilters,
  getFilterCategoryFromPill,
  getPillFromFilterCategory,
  matchesQuickRideDistanceFilter,
} from "../utils/events-filters.utils";

const DISCOVER_SECTION_PREVIEW_LIMIT = 10;

function filterEventsBySearch(events: PublicProfileEvent[], searchQuery: string) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  if (!normalizedSearch) {
    return events;
  }

  return events.filter((event) =>
    [event.title, event.category, event.location, event.organizer, event.date].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
}

export function EventsView() {
  const insets = useSafeAreaInsets();
  const { hasUnread } = useNotificationBadge();
  const { location, requestPermission } = useEventsLocation();
  const storedProfile = getStoredCurrentProfile();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tudo");
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<EventsFilters>(DEFAULT_EVENTS_FILTERS);
  const [draftFilters, setDraftFilters] = useState<EventsFilters>(DEFAULT_EVENTS_FILTERS);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(storedProfile.avatar);
  const [userName, setUserName] = useState<string>(storedProfile.name ?? "Perfil");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [quickRides, setQuickRides] = useState<QuickRide[]>([]);
  const [thisWeekEvents, setThisWeekEvents] = useState<PublicProfileEvent[]>([]);
  const [thisMonthEvents, setThisMonthEvents] = useState<PublicProfileEvent[]>([]);
  const [categorySections, setCategorySections] = useState<EventsDiscoverCategorySection[]>([]);
  const [categoryFilteredEvents, setCategoryFilteredEvents] = useState<PublicProfileEvent[]>([]);
  const [isLoadingCategoryEvents, setIsLoadingCategoryEvents] = useState(false);

  const isCategoryFilterActive = selectedCategory !== "Tudo";

  const userCoords = useMemo(() => {
    if (location.latitude === null || location.longitude === null) {
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }, [location.latitude, location.longitude]);

  const discoverQueryFilters = useMemo(
    () => buildDiscoverQueryFilters(filters, userCoords),
    [filters, userCoords],
  );

  const loadQuickRides = useCallback(
    (overrideFilters?: EventsFilters) => {
      if (location.status !== "ready") {
        return;
      }

      const activeFilters = overrideFilters ?? filters;
      const stateFilter = activeFilters.state !== "ALL" ? activeFilters.state : undefined;

      if (!stateFilter && !location.city) {
        return;
      }

      void fetchActiveQuickRides({
        city: location.city,
        region: location.region,
        state: stateFilter,
      })
        .then((rides) => {
          const filteredRides = rides
            .filter((ride) => isQuickRideDiscoverable(ride))
            .filter((ride) =>
              matchesQuickRideDistanceFilter(ride, userCoords, activeFilters.distanceRange),
            );

          setQuickRides(filteredRides);
        })
        .catch(() => {
          setQuickRides([]);
        });
    },
    [filters, location.city, location.region, location.status, userCoords],
  );

  const loadDiscoverSections = useCallback(() => {
    void fetchEventsDiscoverSections(discoverQueryFilters)
      .then((sections) => {
        setThisWeekEvents(sections.thisWeek);
        setThisMonthEvents(sections.thisMonth);
        setCategorySections(sections.categories);
      })
      .catch(() => {
        setThisWeekEvents([]);
        setThisMonthEvents([]);
        setCategorySections([]);
      });
  }, [discoverQueryFilters]);

  const loadCategoryEvents = useCallback(
    (category: string) => {
      setIsLoadingCategoryEvents(true);

      void fetchEventsDiscoverList({
        category,
        filters: discoverQueryFilters,
        scope: "category",
      })
        .then((events) => {
          setCategoryFilteredEvents(events);
        })
        .catch(() => {
          setCategoryFilteredEvents([]);
        })
        .finally(() => {
          setIsLoadingCategoryEvents(false);
        });
    },
    [discoverQueryFilters],
  );

  const reloadDiscoverData = useCallback(() => {
    if (isCategoryFilterActive) {
      loadCategoryEvents(selectedCategory);
    } else {
      loadDiscoverSections();
    }

    loadQuickRides();
  }, [
    isCategoryFilterActive,
    loadCategoryEvents,
    loadDiscoverSections,
    loadQuickRides,
    selectedCategory,
  ]);

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

  useFocusEffect(
    useCallback(() => {
      reloadDiscoverData();
    }, [reloadDiscoverData]),
  );

  const applyFilters = useCallback(
    (nextFilters: EventsFilters) => {
      const nextQuery = buildDiscoverQueryFilters(nextFilters, userCoords);

      setFilters(nextFilters);
      setDraftFilters(nextFilters);
      setSelectedCategory(getPillFromFilterCategory(nextFilters.category));
      setFiltersSheetOpen(false);

      if (nextFilters.category !== "ALL") {
        setIsLoadingCategoryEvents(true);
        void fetchEventsDiscoverList({
          category: nextFilters.category,
          filters: nextQuery,
          scope: "category",
        })
          .then((events) => {
            setCategoryFilteredEvents(events);
          })
          .catch(() => {
            setCategoryFilteredEvents([]);
          })
          .finally(() => {
            setIsLoadingCategoryEvents(false);
          });
      } else {
        void fetchEventsDiscoverSections(nextQuery)
          .then((sections) => {
            setThisWeekEvents(sections.thisWeek);
            setThisMonthEvents(sections.thisMonth);
            setCategorySections(sections.categories);
          })
          .catch(() => {
            setThisWeekEvents([]);
            setThisMonthEvents([]);
            setCategorySections([]);
          });
      }

      loadQuickRides(nextFilters);
    },
    [loadQuickRides, userCoords],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      const nextFilters = {
        ...filters,
        category: getFilterCategoryFromPill(category),
      };
      const nextQuery = buildDiscoverQueryFilters(nextFilters, userCoords);

      setSelectedCategory(category);
      setFilters(nextFilters);
      setDraftFilters(nextFilters);

      if (category === "Tudo") {
        void fetchEventsDiscoverSections(nextQuery)
          .then((sections) => {
            setThisWeekEvents(sections.thisWeek);
            setThisMonthEvents(sections.thisMonth);
            setCategorySections(sections.categories);
          })
          .catch(() => {
            setThisWeekEvents([]);
            setThisMonthEvents([]);
            setCategorySections([]);
          });
        return;
      }

      setIsLoadingCategoryEvents(true);
      void fetchEventsDiscoverList({
        category,
        filters: nextQuery,
        scope: "category",
      })
        .then((events) => {
          setCategoryFilteredEvents(events);
        })
        .catch(() => {
          setCategoryFilteredEvents([]);
        })
        .finally(() => {
          setIsLoadingCategoryEvents(false);
        });

      loadQuickRides(nextFilters);
    },
    [filters, loadQuickRides, userCoords],
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilters(DEFAULT_EVENTS_FILTERS);
    setDraftFilters(DEFAULT_EVENTS_FILTERS);
    setSelectedCategory("Tudo");
    setCategoryFilteredEvents([]);
    setIsLoadingCategoryEvents(false);
    void fetchEventsDiscoverSections()
      .then((sections) => {
        setThisWeekEvents(sections.thisWeek);
        setThisMonthEvents(sections.thisMonth);
        setCategorySections(sections.categories);
      })
      .catch(() => {
        setThisWeekEvents([]);
        setThisMonthEvents([]);
        setCategorySections([]);
      });
    loadQuickRides(DEFAULT_EVENTS_FILTERS);
  }, [loadQuickRides]);

  const handleOpenFilters = useCallback(() => {
    setDraftFilters(filters);
    setFiltersSheetOpen(true);
  }, [filters]);

  const handleApplyFilters = useCallback(() => {
    applyFilters(draftFilters);
  }, [applyFilters, draftFilters]);

  const activeFilterChips = buildActiveFilterChips(filters, applyFilters);

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
          filters: JSON.stringify(discoverQueryFilters),
          scope,
          title,
        },
      });
    },
    [discoverQueryFilters],
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

  const displayedQuickRides = !isCategoryFilterActive ? quickRides : [];

  const displayedCategoryEvents = useMemo(
    () => filterEventsBySearch(categoryFilteredEvents, searchQuery),
    [categoryFilteredEvents, searchQuery],
  );

  const displayedCategoryPreview = useMemo(
    () => displayedCategoryEvents.slice(0, DISCOVER_SECTION_PREVIEW_LIMIT),
    [displayedCategoryEvents],
  );

  const displayedThisWeekEvents = useMemo(
    () => filterEventsBySearch(thisWeekEvents, searchQuery),
    [searchQuery, thisWeekEvents],
  );

  const displayedThisMonthEvents = useMemo(
    () => filterEventsBySearch(thisMonthEvents, searchQuery),
    [searchQuery, thisMonthEvents],
  );

  const displayedCategorySections = useMemo(
    () =>
      categorySections.map((section) => ({
        ...section,
        events: filterEventsBySearch(section.events, searchQuery),
      })),
    [categorySections, searchQuery],
  );

  const hasDiscoveryResults =
    displayedThisWeekEvents.length > 0 ||
    displayedQuickRides.length > 0 ||
    displayedThisMonthEvents.length > 0 ||
    displayedCategorySections.some((section) => section.events.length > 0);

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
        ) : !hasDiscoveryResults ? (
          <EventsEmptyFiltersCard
            isLoading={false}
            onClearFilters={clearAllFilters}
          />
        ) : (
          <>
            <EventsSection
              events={displayedThisWeekEvents}
              subtitle="Eventos nos próximos 7 dias"
              title="Esta semana"
              onEventPress={handleEventPress}
              onSeeMore={() => handleOpenDiscoverList("this_week", "Esta semana")}
              onToggleFavorite={handleToggleFavorite}
            />

            <QuickRidesSection rides={displayedQuickRides} onRidePress={handleQuickRidePress} />

            <EventsSection
              events={displayedThisMonthEvents}
              title="Encontros do mês"
              onEventPress={handleEventPress}
              onSeeMore={() => handleOpenDiscoverList("this_month", "Encontros do mês")}
              onToggleFavorite={handleToggleFavorite}
            />

            {displayedCategorySections.map((section) => (
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

      <EventsFiltersSheet
        categories={categories}
        draftFilters={draftFilters}
        visible={filtersSheetOpen}
        onApply={handleApplyFilters}
        onChangeDraft={setDraftFilters}
        onClose={() => setFiltersSheetOpen(false)}
        onResetDraft={() => setDraftFilters(DEFAULT_EVENTS_FILTERS)}
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
