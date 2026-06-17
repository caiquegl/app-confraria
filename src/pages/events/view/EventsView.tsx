import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { colors } from "@/theme/colors";

import { EventsCategoryPills } from "../components/EventsCategoryPills";
import { EventsCreateActionSheet } from "../components/EventsCreateActionSheet";
import { EventsCreateFab } from "../components/EventsCreateFab";
import { EventsFilterChips } from "../components/EventsFilterChips";
import { EventsHeaderSection } from "../components/EventsHeaderSection";
import { EventsLocationGate } from "../components/EventsLocationGate";
import { EventsTopBar } from "../components/EventsTopBar";
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
    Toast.show({
      type: "info",
      text1: "Rolê rápido em breve",
    });
  }, []);

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
