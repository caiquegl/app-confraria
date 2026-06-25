import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    getStoredCurrentProfile,
    subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { colors } from "@/theme/colors";

import { ServicesCategoryPills } from "../components/ServicesCategoryPills";
import { ServicesQuickSection } from "../components/ServicesQuickSection";
import { ServicesSection } from "../components/ServicesSection";
import { ServicesTopBar } from "../components/ServicesTopBar";
import {
    MOCK_QUICK_SERVICES,
    MOCK_SECTIONS,
    MOCK_SERVICES,
} from "../mock/services.mock";
import type { Service, ServiceCategory } from "../types/services.types";

export function ServicesView() {
  const insets = useSafeAreaInsets();
  const storedProfile = getStoredCurrentProfile();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory>("Tudo");
  const [userAvatar, setUserAvatar] = useState<string | null>(
    storedProfile.avatar,
  );
  const [userName, setUserName] = useState<string>(
    storedProfile.name ?? "Perfil",
  );
  const [services, setServices] = useState(MOCK_SERVICES);

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setUserAvatar(profile.avatar);
      setUserName(profile.name ?? "Perfil");
    });
  }, []);

  const handleToggleFavorite = useCallback((service: Service) => {
    setServices((current) =>
      current.map((s) =>
        s.id === service.id ? { ...s, isFavorited: !s.isFavorited } : s,
      ),
    );
  }, []);

  const handleServicePress = useCallback((_service: Service) => {
    // TODO: navegar para o detalhe do serviço
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

  const quickServices = useMemo(
    () =>
      filteredBySearch(
        MOCK_QUICK_SERVICES.map(
          (s) => services.find((u) => u.id === s.id) ?? s,
        ),
      ),
    [filteredBySearch, services],
  );

  const sections = useMemo(
    () =>
      MOCK_SECTIONS.map((section) => ({
        ...section,
        services: filteredBySearch(
          section.services.map((s) => services.find((u) => u.id === s.id) ?? s),
        ),
      })).filter((section) =>
        selectedCategory === "Tudo"
          ? true
          : section.category === selectedCategory,
      ),
    [filteredBySearch, selectedCategory, services],
  );

  const showQuickSection =
    selectedCategory === "Tudo" || selectedCategory === "Mecânicas";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 80,
        }}
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

          {showQuickSection && (
            <ServicesQuickSection
              services={quickServices}
              onServicePress={handleServicePress}
            />
          )}

          {sections.map((section) => (
            <ServicesSection
              key={section.category}
              services={section.services}
              title={section.category}
              onServicePress={handleServicePress}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingTop: 12,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});
