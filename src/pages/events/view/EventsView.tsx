import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { getCurrentUserId } from "@/lib/auth";
import {
  getStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { fetchEventCategories } from "@/pages/event-create/services/event-create.service";
import { useNotificationBadge } from "@/pages/notifications";
import { fetchActiveQuickRides } from "@/pages/quick-rides/services/quick-rides.service";
import type { QuickRide } from "@/pages/quick-rides/types/quick-ride.types";
import { isQuickRideDiscoverable } from "@/pages/quick-rides/types/quick-ride.types";
import { colors } from "@/theme/colors";

import { EventsCategoryPills } from "../components/EventsCategoryPills";
import { EventsCreateActionSheet } from "../components/EventsCreateActionSheet";
import { EventsCreateFab } from "../components/EventsCreateFab";
import { EventsFilterChips } from "../components/EventsFilterChips";
import { EventsHeaderSection } from "../components/EventsHeaderSection";
import { EventsLocationGate } from "../components/EventsLocationGate";
import { EventsTopBar } from "../components/EventsTopBar";
import { QuickRidesSection } from "../components/QuickRidesSection";
import { useEventsLocation } from "../hooks/useEventsLocation";
import type { EventsFilterChip } from "../types/events.types";

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
  const isMountedRef = useRef(true);

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
    }, [loadQuickRides]),
  );

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

  const displayedQuickRides =
    location.status === "ready" && location.city
      ? quickRides.filter((ride) => isQuickRideDiscoverable(ride))
      : [];

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

        <EventsFilterChips chips={activeFilterChips} onClearAll={() => undefined} />

        <EventsCategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onChange={setSelectedCategory}
        />

        <QuickRidesSection rides={displayedQuickRides} onRidePress={handleQuickRidePress} />

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Listagem de eventos em breve</Text>
        </View>
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
  placeholder: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});
