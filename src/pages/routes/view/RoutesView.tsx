import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
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
import { Button } from "@/components/Button";
import { LocationGate } from "@/components/LocationGate";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import {
  getStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { useGeolocation } from "@/lib/location";
import { useNotificationBadge } from "@/pages/notifications";
import { colors } from "@/theme/colors";

import { RoutesFiltersSheet, getUniqueBikeNames } from "../components/RoutesFiltersSheet";
import { RoutesNewTripButton } from "../components/RoutesNewTripButton";
import { SavedRouteCard } from "../components/SavedRouteCard";
import { useMyRoutes } from "../hooks/useMyRoutes";
import type { SavedRouteFilters } from "../types/saved-route.types";
import {
  COMPLETION_OPTIONS,
  DEFAULT_ROUTE_FILTERS,
  ONGOING_GROUP_LABEL,
  QUICK_PERIOD_OPTIONS,
  buildActiveFilterChips,
  filterSavedRoutes,
  groupSavedRoutes,
  hasAppliedRouteFilters,
  isRouteOngoing,
} from "../utils/saved-routes-filters.utils";

type RoutesTab = "all" | "mine";

const ROUTES_TABS = [
  { key: "all" as const, label: "Todas as Rotas" },
  { key: "mine" as const, label: "Minhas Rotas" },
];

export function RoutesView() {
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { hasUnread } = useNotificationBadge();
  const { location, requestPermission } = useGeolocation();
  const storedProfile = getStoredCurrentProfile();
  const { error, isLoading, routes } = useMyRoutes();

  const [activeTab, setActiveTab] = useState<RoutesTab>("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SavedRouteFilters>(DEFAULT_ROUTE_FILTERS);
  const [draftFilters, setDraftFilters] = useState<SavedRouteFilters>(DEFAULT_ROUTE_FILTERS);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(storedProfile.avatar);
  const [userName, setUserName] = useState<string>(storedProfile.name ?? "Perfil");

  useEffect(() => {
    if (tab === "mine" || tab === "all") {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setUserAvatar(profile.avatar);
      setUserName(profile.name ?? "Perfil");
    });
  }, []);

  const filteredRoutes = useMemo(
    () => filterSavedRoutes(routes, filters, searchQuery),
    [filters, routes, searchQuery],
  );
  const groupedRoutes = useMemo(() => groupSavedRoutes(filteredRoutes), [filteredRoutes]);
  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(filters, setFilters),
    [filters],
  );
  const hasAppliedFilters = hasAppliedRouteFilters(filters);
  const isActiveNavigation = routes.some(isRouteOngoing);
  const ongoingRoute = useMemo(() => routes.find(isRouteOngoing) ?? null, [routes]);
  const bikeOptions = useMemo(() => getUniqueBikeNames(routes), [routes]);

  const clearAllFilters = () => {
    setFilters(DEFAULT_ROUTE_FILTERS);
    setDraftFilters(DEFAULT_ROUTE_FILTERS);
  };

  const openFiltersSheet = () => {
    setDraftFilters(filters);
    setShowFiltersSheet(true);
  };

  if (location.status !== "ready" || !location.cityLabel) {
    return (
      <LocationGate
        canAskAgain={location.canAskAgain}
        purpose="routes"
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
        <View style={styles.stickyHeader}>
          <AppTopBar
            hasUnreadNotifications={hasUnread}
            locationLabel={location.cityLabel}
            searchPlaceholder="Buscar rota por nome"
            searchQuery={searchQuery}
            topInset={insets.top}
            userAvatar={userAvatar}
            userName={userName}
            onOpenNotifications={() => router.push("/notifications")}
            onOpenProfile={() => router.push("/profile")}
            onSearchChange={setSearchQuery}
          />

          <View style={styles.tabsSection}>
            <SegmentedTabs activeTab={activeTab} tabs={ROUTES_TABS} onChange={setActiveTab} />
          </View>
        </View>

        {activeTab === "mine" ? (
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.eyebrow}>Planejamento</Text>
                <Text style={styles.pageTitle}>Rotas Criadas</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.filtersButton}
                onPress={openFiltersSheet}
              >
                <Ionicons color="#6B7280" name="settings-outline" size={16} />
                <Text style={styles.filtersButtonText}>Filtros</Text>
                {hasAppliedFilters ? (
                  <View style={styles.filtersBadge}>
                    <Text style={styles.filtersBadgeText}>{activeFilterChips.length}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <ScrollView
              horizontal
              contentContainerStyle={styles.quickFilters}
              showsHorizontalScrollIndicator={false}
            >
              <Pressable
                accessibilityRole="button"
                style={[styles.quickChip, !hasAppliedFilters && styles.quickChipActive]}
                onPress={clearAllFilters}
              >
                <Text
                  style={[styles.quickChipText, !hasAppliedFilters && styles.quickChipTextActive]}
                >
                  Todos
                </Text>
              </Pressable>

              {COMPLETION_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  style={[
                    styles.quickChip,
                    filters.completion === option.key && styles.quickChipActive,
                  ]}
                  onPress={() =>
                    setFilters((current) => ({
                      ...current,
                      completion:
                        current.completion === option.key ? "ALL" : option.key,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      filters.completion === option.key && styles.quickChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}

              <View style={styles.quickDivider} />

              {QUICK_PERIOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  style={[
                    styles.quickChip,
                    filters.period === option.key && styles.quickChipActive,
                  ]}
                  onPress={() =>
                    setFilters((current) => ({
                      ...current,
                      period: current.period === option.key ? "ALL" : option.key,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      filters.period === option.key && styles.quickChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {isActiveNavigation && ongoingRoute ? (
              <Pressable
                accessibilityRole="button"
                style={styles.navigationBanner}
                onPress={() => router.push(`/routes/${ongoingRoute.id}/navigate` as Href)}
              >
                <View style={styles.navigationIcon}>
                  <Ionicons color={colors.brandDark} name="navigate" size={18} />
                </View>
                <View style={styles.navigationCopy}>
                  <Text style={styles.navigationEyebrow}>Em navegação</Text>
                  <Text style={styles.navigationTitle}>Rota ativa em andamento</Text>
                </View>
                <View style={styles.navigationAction}>
                  <Text style={styles.navigationActionText}>Retomar →</Text>
                </View>
              </Pressable>
            ) : null}

            {activeFilterChips.length > 0 ? (
              <View style={styles.activeChips}>
                {activeFilterChips.map((chip) => (
                  <Pressable
                    key={chip.key}
                    accessibilityRole="button"
                    style={styles.activeChip}
                    onPress={chip.onRemove}
                  >
                    <Text style={styles.activeChipText}>{chip.label}</Text>
                    <Ionicons color={colors.brandDark} name="close" size={12} />
                  </Pressable>
                ))}
                <Pressable accessibilityRole="button" onPress={clearAllFilters}>
                  <Text style={styles.clearAllText}>Limpar tudo</Text>
                </Pressable>
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.brandDark} size="large" />
              </View>
            ) : error ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{error}</Text>
              </View>
            ) : routes.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons color="#D1D5DB" name="map-outline" size={48} />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma rota criada</Text>
                <Text style={styles.emptySubtitle}>
                  Planeje sua próxima aventura e salve seus passeios para acompanhar datas e
                  lembretes.
                </Text>
                <Button
                  size="lg"
                  style={styles.emptyButton}
                  onPress={() => router.push("/routes/create" as Href)}
                >
                  Criar nova rota
                </Button>
              </View>
            ) : filteredRoutes.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons color="#D1D5DB" name="search-outline" size={40} />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery.trim()
                    ? "Nenhum resultado para a busca"
                    : "Nenhuma rota encontrada com os filtros atuais"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Ajuste a busca ou limpe os filtros para voltar a ver seus passeios.
                </Text>
                <Button
                  size="lg"
                  style={styles.emptyButton}
                  onPress={() => {
                    setSearchQuery("");
                    clearAllFilters();
                  }}
                >
                  Limpar filtros
                </Button>
              </View>
            ) : (
              <View style={styles.groups}>
                {groupedRoutes.map((group) => {
                  const isOngoing = group.label === ONGOING_GROUP_LABEL;
                  return (
                    <View key={group.label} style={styles.groupSection}>
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>{group.label}</Text>
                        {!isOngoing ? (
                          <Text style={styles.groupCount}>
                            {group.routes.length} passeio
                            {group.routes.length > 1 ? "s" : ""}
                          </Text>
                        ) : null}
                      </View>

                      {isOngoing ? (
                        <SavedRouteCard
                          fullWidth
                          route={group.routes[0]}
                          onPress={() =>
                            router.push(`/routes/${group.routes[0].id}` as Href)
                          }
                        />
                      ) : (
                        <ScrollView
                          horizontal
                          contentContainerStyle={styles.carousel}
                          showsHorizontalScrollIndicator={false}
                        >
                          {group.routes.map((route) => (
                            <SavedRouteCard
                              key={route.id}
                              route={route}
                              onPress={() => router.push(`/routes/${route.id}` as Href)}
                            />
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.communityPlaceholder}>
            <Text style={styles.communityTitle}>Todas as Rotas</Text>
            <Text style={styles.communitySubtitle}>
              Em breve você poderá explorar rotas da comunidade por aqui.
            </Text>
          </View>
        )}
      </ScrollView>

      {activeTab === "mine" && !isActiveNavigation && routes.length > 0 ? (
        <RoutesNewTripButton onPress={() => router.push("/routes/create" as Href)} />
      ) : null}

      <RoutesFiltersSheet
        bikes={bikeOptions}
        draftFilters={draftFilters}
        visible={showFiltersSheet}
        onApply={() => {
          setFilters(draftFilters);
          setShowFiltersSheet(false);
        }}
        onChangeDraft={setDraftFilters}
        onClear={clearAllFilters}
        onClose={() => setShowFiltersSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  activeChip: {
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
  activeChipText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "600",
  },
  activeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  carousel: {
    gap: 12,
    paddingRight: 24,
  },
  clearAllText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  communityPlaceholder: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  communitySubtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  communityTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  emptyButton: {
    marginTop: 24,
    minWidth: 220,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    height: 96,
    justifyContent: "center",
    marginBottom: 24,
    width: 96,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
  },
  emptySubtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 260,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  eyebrow: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  filtersBadge: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 6,
  },
  filtersBadgeText: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "800",
  },
  filtersButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    paddingHorizontal: 16,
  },
  filtersButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  groupCount: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  groupSection: {
    marginBottom: 24,
  },
  groupTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
  groups: {
    paddingBottom: 24,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  navigationAction: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navigationActionText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  navigationBanner: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.brandGreen,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    padding: 12,
  },
  navigationCopy: {
    flex: 1,
    minWidth: 0,
  },
  navigationEyebrow: {
    color: "#728F21",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  navigationIcon: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  navigationTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  pageTitle: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
  quickChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickChipActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  quickChipText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },
  quickChipTextActive: {
    color: colors.brandDark,
    fontWeight: "700",
  },
  quickDivider: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    height: 20,
    marginHorizontal: 4,
    width: 1,
  },
  quickFilters: {
    gap: 8,
    marginBottom: 16,
    paddingRight: 24,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: colors.brandGray,
  },
  tabsSection: {
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  titleRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
});
