import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    getStoredCurrentProfile,
    subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { colors } from "@/theme/colors";

import { useServices } from "../business/useServices";
import { ServicesCategoryPills } from "../components/ServicesCategoryPills";
import { ServicesQuickSection } from "../components/ServicesQuickSection";
import { ServicesSection } from "../components/ServicesSection";
import { ServicesTopBar } from "../components/ServicesTopBar";
import type { Service, ServiceCategory } from "../types/services.types";

const QUICK_CATEGORY = "Mecânicas";

export function ServicesView() {
  const insets = useSafeAreaInsets();
  const storedProfile = getStoredCurrentProfile();

  const {
    error,
    isLoading,
    isRefreshing,
    quickServices,
    refresh,
    sections,
    toggleFavorite,
  } = useServices();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory>("Tudo");
  const [userAvatar, setUserAvatar] = useState<string | null>(
    storedProfile.avatar,
  );
  const [userName, setUserName] = useState<string>(
    storedProfile.name ?? "Perfil",
  );

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setUserAvatar(profile.avatar);
      setUserName(profile.name ?? "Perfil");
    });
  }, []);

  const handleServicePress = useCallback((service: Service) => {
    router.push(`/services/${service.id}`);
  }, []);

  const filteredBySearch = useCallback(
    (items: Service[]) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return items;
      return items.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query),
      );
    },
    [searchQuery],
  );

  const filteredQuickServices = useMemo(
    () => filteredBySearch(quickServices),
    [filteredBySearch, quickServices],
  );

  const filteredSections = useMemo(
    () =>
      sections
        .filter((section) => section.category !== QUICK_CATEGORY)
        .map((section) => ({
          ...section,
          services: filteredBySearch(section.services),
        }))
        .filter((section) =>
          selectedCategory === "Tudo"
            ? true
            : section.category === selectedCategory,
        ),
    [filteredBySearch, sections, selectedCategory],
  );

  const showQuickSection =
    selectedCategory === "Tudo" || selectedCategory === QUICK_CATEGORY;

  const hasResults =
    (showQuickSection && filteredQuickServices.length > 0) ||
    filteredSections.some((section) => section.services.length > 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 80,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <ServicesTopBar
          searchQuery={searchQuery}
          userAvatar={userAvatar}
          userName={userName}
          onOpenProfile={() => router.push("/profile")}
          onSearchChange={setSearchQuery}
        />

        <View style={styles.body}>
          <ServicesCategoryPills
            selectedCategory={selectedCategory}
            onChange={setSelectedCategory}
          />

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.brandPrimary} size="large" />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={refresh}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {showQuickSection && (
                <ServicesQuickSection
                  services={filteredQuickServices}
                  onServicePress={handleServicePress}
                />
              )}

              {filteredSections.map((section) => (
                <ServicesSection
                  key={section.category}
                  services={section.services}
                  title={section.category}
                  onServicePress={handleServicePress}
                  onToggleFavorite={toggleFavorite}
                />
              ))}

              {!hasResults && (
                <View style={styles.centered}>
                  <Text style={styles.stateText}>
                    Nenhum serviço encontrado.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingTop: 12,
  },
  centered: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  retryButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  stateText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});
