import { router, useFocusEffect } from "expo-router";
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
import Toast from "react-native-toast-message";

import { LocationGate } from "@/components/LocationGate";
import {
    getStoredCurrentProfile,
    subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { useGeolocation } from "@/lib/location";
import { colors } from "@/theme/colors";

import { useNearbyServices } from "../business/useNearbyServices";
import { useServices } from "../business/useServices";
import { ServicesCategoryPills } from "../components/ServicesCategoryPills";
import { ServicesQuickSection } from "../components/ServicesQuickSection";
import { ServicesSection } from "../components/ServicesSection";
import { ServicesTopBar } from "../components/ServicesTopBar";
import { importPlace } from "../services/nearby.service";
import type { Service, ServiceCategory } from "../types/services.types";

const QUICK_CATEGORY = "Mecânicas";
const NEARBY_CATEGORY = "Próximos";

export function ServicesView() {
  const insets = useSafeAreaInsets();
  const storedProfile = getStoredCurrentProfile();
  const [isFocused, setIsFocused] = useState(true);

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
  const [importingId, setImportingId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(
    storedProfile.avatar,
  );
  const [userName, setUserName] = useState<string>(
    storedProfile.name ?? "Perfil",
  );

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const isNearby = selectedCategory === NEARBY_CATEGORY;
  const { location, requestPermission } = useGeolocation();
  const nearby = useNearbyServices(
    { latitude: location.latitude, longitude: location.longitude },
    isNearby && isFocused,
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

  const handleNearbyPress = useCallback(async (service: Service) => {
    if (!service.googlePlaceId || importingId) return;
    setImportingId(service.googlePlaceId);
    try {
      const { service: saved } = await importPlace({
        category: service.category,
        googlePlaceId: service.googlePlaceId,
      });
      router.push(`/services/${saved.id}`);
    } catch {
      Toast.show({
        type: "error",
        text1: "Não foi possível abrir o local",
        text2: "Tente novamente em instantes.",
      });
    } finally {
      setImportingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importingId]);

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

  const locationReady =
    location.status === "ready" &&
    location.latitude !== null &&
    location.longitude !== null;

  const renderCatalog = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      );
    }

    if (error) {
      return (
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
      );
    }

    return (
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
            <Text style={styles.stateText}>Nenhum serviço encontrado.</Text>
          </View>
        )}
      </>
    );
  };

  const renderNearby = () => {
    if (!locationReady) {
      return (
        <View style={styles.gateWrap}>
          <LocationGate
            canAskAgain={location.canAskAgain}
            purpose="services"
            status={location.status}
            onRequestPermission={() => void requestPermission()}
          />
        </View>
      );
    }

    if (nearby.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
          <Text style={styles.stateText}>Buscando locais perto de você…</Text>
        </View>
      );
    }

    if (nearby.error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.stateText}>{nearby.error}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void nearby.refresh()}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return nearby.sections.map((section) => (
      <ServicesSection
        key={section.category}
        services={filteredBySearch(section.services)}
        title={section.category}
        onServicePress={handleNearbyPress}
      />
    ));
  };

  return (
    <View style={styles.screen}>
      {importingId ? (
        <View style={styles.importOverlay} pointerEvents="auto">
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 80,
        }}
        refreshControl={
          isNearby ? undefined : (
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          )
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

          {isNearby ? renderNearby() : renderCatalog()}
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
  gateWrap: {
    minHeight: 440,
  },
  importOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 50,
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
