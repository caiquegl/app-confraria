import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTopBar } from "@/components/AppTopBar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import {
  getStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { useGeolocation } from "@/lib/location";
import { useNotificationBadge } from "@/pages/notifications";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import {
  CommunityRoutesFiltersSheet,
  DEFAULT_COMMUNITY_ROUTE_FILTERS,
  type CommunityRoutesFilters,
} from "../components/CommunityRoutesFiltersSheet";
import { RoutesHorizontalSection } from "../components/RoutesHorizontalSection";
import { useFriendsRoutes } from "../hooks/useFriendsRoutes";
import { useMyPublishedRoutes } from "../hooks/useMyPublishedRoutes";
import { useNearPublishedRoutes } from "../hooks/useNearPublishedRoutes";
import type { SavedRoute } from "../types/saved-route.types";

function filterCommunityRoutes(routes: SavedRoute[], filters: CommunityRoutesFilters) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (filters.minRating <= 0) {
    return routes;
  }

  return routes.filter((route) => (route.rating ?? 0) >= filters.minRating);
}

export function RoutesExploreView() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { hasUnread } = useNotificationBadge();
  const { location } = useGeolocation();
  const storedProfile = getStoredCurrentProfile();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<CommunityRoutesFilters>(DEFAULT_COMMUNITY_ROUTE_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<CommunityRoutesFilters>(DEFAULT_COMMUNITY_ROUTE_FILTERS);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(storedProfile.avatar);
  const [userName, setUserName] = useState<string>(storedProfile.name ?? "Perfil");

  const publishedRoutes = useMyPublishedRoutes({
    enabled: true,
    searchQuery,
  });
  const nearRoutes = useNearPublishedRoutes({
    city: location.city,
    enabled: true,
    region: location.region,
    searchQuery,
  });
  const friendsRoutes = useFriendsRoutes({
    enabled: true,
    searchQuery,
  });

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setUserAvatar(profile.avatar);
      setUserName(profile.name ?? "Perfil");
    });
  }, []);

  const filteredPublishedRoutes = useMemo(
    () => filterCommunityRoutes(publishedRoutes.routes, filters),
    [filters, publishedRoutes.routes],
  );
  const filteredNearRoutes = useMemo(
    () => filterCommunityRoutes(nearRoutes.routes, filters),
    [filters, nearRoutes.routes],
  );
  const filteredFriendsRoutes = useMemo(
    () => filterCommunityRoutes(friendsRoutes.routes, filters),
    [filters, friendsRoutes.routes],
  );

  const hasCommunityContent =
    filteredPublishedRoutes.length > 0 ||
    filteredNearRoutes.length > 0 ||
    filteredFriendsRoutes.length > 0;
  const isCommunityLoading =
    (publishedRoutes.isLoading || nearRoutes.isLoading || friendsRoutes.isLoading) &&
    !hasCommunityContent;
  const hasInitialListError =
    !hasCommunityContent &&
    (publishedRoutes.error === "initial" ||
      nearRoutes.error === "initial" ||
      friendsRoutes.error === "initial");
  const hasAppliedFilters = filters.minRating > 0;
  const hasSearchOrFilters = searchQuery.trim().length > 0 || hasAppliedFilters;

  const locationLabel =
    location.cityLabel ?? (location.status === "ready" ? "Localização atual" : "Explorar rotas");

  const clearFilters = () => {
    setSearchQuery("");
    setFilters(DEFAULT_COMMUNITY_ROUTE_FILTERS);
    setDraftFilters(DEFAULT_COMMUNITY_ROUTE_FILTERS);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 96 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.stickyHeader}>
          <AppTopBar
            hasUnreadNotifications={hasUnread}
            locationLabel={locationLabel}
            searchPlaceholder="Buscar rota"
            searchQuery={searchQuery}
            showBack
            userAvatar={userAvatar}
            userName={userName}
            onBack={() => router.back()}
            onOpenNotifications={() => router.push("/notifications")}
            onOpenProfile={() => router.push("/profile")}
            onSearchChange={setSearchQuery}
          />

          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.pageTitle}>Todas as Rotas</Text>
              <Text style={styles.pageSubtitle}>Encontre novas rotas para você sair</Text>
            </View>

            <Pressable
              accessibilityLabel="Abrir filtros"
              accessibilityRole="button"
              style={styles.filtersButton}
              onPress={() => {
                setDraftFilters(filters);
                setShowFiltersSheet(true);
              }}
            >
              <Ionicons color={colors.text.secondary} name="options-outline" size={16} />
              <Text style={styles.filtersButtonText}>Filtros</Text>
              {hasAppliedFilters ? (
                <View style={styles.filtersBadge}>
                  <Text style={styles.filtersBadgeText}>1</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {hasAppliedFilters ? (
            <View style={styles.activeFiltersRow}>
              <Pressable
                accessibilityRole="button"
                style={styles.activeFilterChip}
                onPress={() => {
                  const next = { ...filters, minRating: 0 };
                  setFilters(next);
                  setDraftFilters(next);
                }}
              >
                <Text style={styles.activeFilterChipText}>
                  Nota ≥ {filters.minRating.toFixed(1).replace(".", ",")}
                </Text>
                <Ionicons color={colors.brandDark} name="close" size={12} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={clearFilters}>
                <Text style={styles.clearAllText}>Limpar tudo</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.communityContent}>
          <RoutesHorizontalSection
            cardVariant="community"
            hasMore={publishedRoutes.hasMore}
            isLoading={publishedRoutes.isLoading}
            isLoadingMore={publishedRoutes.isLoadingMore}
            paginationError={publishedRoutes.error === "pagination"}
            routes={filteredPublishedRoutes}
            subtitle="Suas rotas disponíveis para o Confraria"
            title="Publicadas por você"
            onLoadMore={() => void publishedRoutes.loadMore()}
            onRoutePress={(routeId) => router.push(`/routes/${routeId}` as Href)}
          />

          <RoutesHorizontalSection
            cardVariant="community"
            hasMore={nearRoutes.hasMore}
            isLoading={nearRoutes.isLoading}
            isLoadingMore={nearRoutes.isLoadingMore}
            paginationError={nearRoutes.error === "pagination"}
            routes={filteredNearRoutes}
            subtitle="Roteiros compartilhados perto da sua região"
            title="Rotas próximas de você"
            onLoadMore={() => void nearRoutes.loadMore()}
            onRoutePress={(routeId) => router.push(`/routes/${routeId}` as Href)}
          />

          <RoutesHorizontalSection
            cardVariant="community"
            hasMore={friendsRoutes.hasMore}
            isLoading={friendsRoutes.isLoading}
            isLoadingMore={friendsRoutes.isLoadingMore}
            paginationError={friendsRoutes.error === "pagination"}
            routes={filteredFriendsRoutes}
            subtitle="Roteiros de quem você segue no Confraria"
            title="Rotas de amigos"
            onLoadMore={() => void friendsRoutes.loadMore()}
            onRoutePress={(routeId) => router.push(`/routes/${routeId}` as Href)}
          />

          {hasInitialListError ? (
            <View style={styles.emptyStateWrap}>
              <ErrorState
                description="Verifique a conexão e tente novamente. Isso não significa que não há rotas."
                layout="card"
                retrying={isCommunityLoading}
                title="Não foi possível carregar as rotas"
                onRetry={() => {
                  void publishedRoutes.refresh();
                  void nearRoutes.refresh();
                  void friendsRoutes.refresh();
                }}
              />
            </View>
          ) : isCommunityLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
          ) : !hasCommunityContent ? (
            <View style={styles.emptyStateWrap}>
              <EmptyState
                description={
                  hasSearchOrFilters
                    ? "Ajuste a busca ou os filtros para ver mais resultados."
                    : "Ainda não há rotas publicadas para mostrar."
                }
                icon={hasSearchOrFilters ? "search-outline" : "map-outline"}
                layout="card"
                title={hasSearchOrFilters ? "Nenhuma rota encontrada" : "Nenhuma rota disponível"}
                action={
                  hasSearchOrFilters
                    ? {
                        accessibilityLabel: "Limpar busca e filtros de rotas da comunidade",
                        label: "Limpar filtros",
                        onPress: clearFilters,
                      }
                    : {
                        accessibilityLabel: "Recarregar rotas da comunidade",
                        label: "Tentar novamente",
                        onPress: () => {
                          void publishedRoutes.refresh();
                          void nearRoutes.refresh();
                          void friendsRoutes.refresh();
                        },
                      }
                }
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <CommunityRoutesFiltersSheet
        draftFilters={draftFilters}
        visible={showFiltersSheet}
        onApply={() => {
          setFilters(draftFilters);
          setShowFiltersSheet(false);
        }}
        onChangeDraft={setDraftFilters}
        onClear={() => {
          setDraftFilters(DEFAULT_COMMUNITY_ROUTE_FILTERS);
        }}
        onClose={() => setShowFiltersSheet(false)}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  activeFilterChip: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.2)",
    borderColor: colors.brandGreen,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeFilterChipText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "600",
  },
  activeFiltersRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  clearAllText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  communityContent: {
    paddingBottom: 24,
  },
  emptyStateWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  filtersBadge: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 4,
  },
  filtersBadgeText: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "800",
  },
  filtersButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 48,
    paddingHorizontal: 14,
  },
  filtersButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  pageSubtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  pageTitle: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: colors.brandGray,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
});
