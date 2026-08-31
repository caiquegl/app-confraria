import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { AppTopBar } from "@/components/AppTopBar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import {
  getStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { ensureRouteBackgroundTracking } from "@/lib/route-background-tracking";
import { routeTrackingLog } from "@/lib/route-tracking-logger";
import { getApiErrorMessage } from "@/lib/password-reset";
import { useGeolocation } from "@/lib/location";
import { useNotificationBadge } from "@/pages/notifications";
import { colors } from "@/theme/colors";

import { RoutesFiltersSheet, getUniqueBikeNames } from "../components/RoutesFiltersSheet";
import { RoutesNewTripButton } from "../components/RoutesNewTripButton";
import { SavedRouteCard } from "../components/SavedRouteCard";
import { useMyRoutes } from "../hooks/useMyRoutes";
import type { SavedRouteFilters } from "../types/saved-route.types";
import {
  COMPLETED_GROUP_LABEL,
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

export function RoutesMineView() {
  const insets = useSafeAreaInsets();
  const { hasUnread } = useNotificationBadge();
  const { location } = useGeolocation();
  const storedProfile = getStoredCurrentProfile();
  const { error, isLoading, quota, refresh, routes } = useMyRoutes();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SavedRouteFilters>(DEFAULT_ROUTE_FILTERS);
  const [draftFilters, setDraftFilters] = useState<SavedRouteFilters>(DEFAULT_ROUTE_FILTERS);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(storedProfile.avatar);
  const [userName, setUserName] = useState<string>(storedProfile.name ?? "Perfil");

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
  const groupedRoutes = useMemo(() => {
    const groups = groupSavedRoutes(filteredRoutes);
    if (
      !quota.historyLimited ||
      groups.some((group) => group.label === COMPLETED_GROUP_LABEL)
    ) {
      return groups;
    }
    return [...groups, { label: COMPLETED_GROUP_LABEL, routes: [] }];
  }, [filteredRoutes, quota.historyLimited]);
  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(filters, setFilters),
    [filters],
  );
  const hasAppliedFilters = hasAppliedRouteFilters(filters);
  const isActiveNavigation = routes.some(isRouteOngoing);
  const ongoingRoute = useMemo(() => routes.find(isRouteOngoing) ?? null, [routes]);
  const bikeOptions = useMemo(() => getUniqueBikeNames(routes), [routes]);

  const locationLabel = location.cityLabel ?? "Minhas rotas";

  useEffect(() => {
    if (!ongoingRoute) return;

    routeTrackingLog.info("RoutesMineView:auto-start-tracking", {
      routeId: ongoingRoute.id,
      title: ongoingRoute.title,
    });

    void ensureRouteBackgroundTracking(ongoingRoute.id, ongoingRoute.title)
      .then((result) => {
        routeTrackingLog.info("RoutesMineView:auto-start-tracking:done", {
          routeId: ongoingRoute.id,
          wasAlreadyActive: result.wasAlreadyActive,
        });
      })
      .catch((trackingError) => {
        routeTrackingLog.error("RoutesMineView:auto-start-tracking:failed", trackingError, {
          routeId: ongoingRoute.id,
        });
        Toast.show({
          text1: "Rastreamento em segundo plano",
          text2: getApiErrorMessage(
            trackingError,
            "Permita localização e notificações para continuar rastreado ao sair do app.",
          ),
          type: "error",
        });
      });
  }, [ongoingRoute]);

  const clearAllFilters = () => {
    setFilters(DEFAULT_ROUTE_FILTERS);
    setDraftFilters(DEFAULT_ROUTE_FILTERS);
  };

  const openFiltersSheet = () => {
    setDraftFilters(filters);
    setShowFiltersSheet(true);
  };

  const handleResumeOngoingRoute = useCallback(async () => {
    if (!ongoingRoute) return;

    routeTrackingLog.info("RoutesMineView:resume-banner-pressed", {
      routeId: ongoingRoute.id,
      title: ongoingRoute.title,
    });

    try {
      const result = await ensureRouteBackgroundTracking(ongoingRoute.id, ongoingRoute.title);
      routeTrackingLog.info("RoutesMineView:resume-banner-pressed:done", {
        routeId: ongoingRoute.id,
        wasAlreadyActive: result.wasAlreadyActive,
      });
    } catch (trackingError) {
      routeTrackingLog.error("RoutesMineView:resume-banner-pressed:failed", trackingError, {
        routeId: ongoingRoute.id,
      });
      Toast.show({
        text1: "Rastreamento em segundo plano",
        text2: getApiErrorMessage(
          trackingError,
          "Permita localização em segundo plano para continuar rastreado ao sair do app.",
        ),
        type: "error",
      });
    }

    router.push(`/routes/${ongoingRoute.id}/navigate` as Href);
  }, [ongoingRoute]);

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
            searchPlaceholder="Buscar rota por nome"
            searchQuery={searchQuery}
            userAvatar={userAvatar}
            userName={userName}
            onOpenNotifications={() => router.push("/notifications")}
            onOpenProfile={() => router.push("/profile")}
            onSearchChange={setSearchQuery}
          />

          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Voltar para o mapa"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Biblioteca</Text>
              <Text style={styles.pageTitle}>Minhas rotas</Text>
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
        </View>

        <View style={styles.content}>
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
                    completion: current.completion === option.key ? "ALL" : option.key,
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
                style={[styles.quickChip, filters.period === option.key && styles.quickChipActive]}
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
              onPress={() => void handleResumeOngoingRoute()}
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

          {!quota.isPremium && quota.savedPrivateLimit != null ? (
            <View style={styles.quotaCard}>
              <View style={styles.quotaCopy}>
                <Text style={styles.quotaTitle}>Rotas salvas</Text>
                <Text style={styles.quotaValue}>
                  {quota.savedPrivateCount} de {quota.savedPrivateLimit}
                </Text>
              </View>
              {quota.savedPrivateCount >= quota.savedPrivateLimit ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.quotaCta}
                  onPress={() => router.push("/profile/subscription" as Href)}
                >
                  <Text style={styles.quotaCtaText}>Assinar</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {error === "initial" && routes.length === 0 ? (
            <ErrorState
              description="Verifique a conexão e tente novamente. Isso não significa que você não tem rotas."
              retrying={isLoading}
              title="Não foi possível carregar suas rotas"
              onRetry={() => void refresh()}
            />
          ) : isLoading && routes.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
          ) : routes.length === 0 ? (
            <EmptyState
              description="Planeje seu próximo roteiro e salve seus passeios para acompanhar datas e lembretes."
              icon="map-outline"
              title="Nenhuma rota criada"
              action={{
                accessibilityLabel: "Planejar roteiro",
                label: "Planejar roteiro",
                onPress: () => router.push("/routes/create" as Href),
              }}
            />
          ) : filteredRoutes.length === 0 ? (
            <EmptyState
              description="Ajuste a busca ou limpe os filtros para voltar a ver seus passeios."
              icon="search-outline"
              title={
                searchQuery.trim()
                  ? "Nenhum resultado para a busca"
                  : "Nenhuma rota encontrada com os filtros atuais"
              }
              action={{
                accessibilityLabel: "Limpar busca e filtros de rotas",
                label: "Limpar filtros",
                onPress: () => {
                  setSearchQuery("");
                  clearAllFilters();
                },
              }}
            />
          ) : (
            <View style={styles.groups}>
              {groupedRoutes.map((group) => {
                const isOngoing = group.label === ONGOING_GROUP_LABEL;
                const isCompleted = group.label === COMPLETED_GROUP_LABEL;
                return (
                  <View key={group.label} style={styles.groupSection}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupTitle}>{group.label}</Text>
                      {!isOngoing && group.routes.length > 0 ? (
                        <Text style={styles.groupCount}>
                          {group.routes.length} passeio
                          {group.routes.length > 1 ? "s" : ""}
                        </Text>
                      ) : null}
                    </View>

                    {isCompleted && quota.historyLimited ? (
                      <Pressable
                        accessibilityRole="button"
                        style={styles.historyBanner}
                        onPress={() => router.push("/profile/subscription" as Href)}
                      >
                        <Ionicons color={colors.brandDark} name="time-outline" size={16} />
                        <View style={styles.historyCopy}>
                          <Text style={styles.historyTitle}>
                            Mostrando os últimos {quota.historyDays ?? 30} dias
                          </Text>
                          <Text style={styles.historySubtitle}>
                            Assine para ver seu histórico completo
                          </Text>
                        </View>
                        <Ionicons color="#9CA3AF" name="chevron-forward" size={16} />
                      </Pressable>
                    ) : null}

                    {isOngoing ? (
                      <SavedRouteCard
                        fullWidth
                        route={group.routes[0]}
                        onPress={() => router.push(`/routes/${group.routes[0].id}` as Href)}
                      />
                    ) : (
                      <View style={styles.groupList}>
                        {group.routes.map((route) => (
                          <SavedRouteCard
                            key={route.id}
                            fullWidth
                            route={route}
                            onPress={() => router.push(`/routes/${route.id}` as Href)}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {!isActiveNavigation && routes.length > 0 ? (
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
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
  groupList: {
    gap: 12,
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
  historyBanner: {
    alignItems: "center",
    backgroundColor: "#F8FAF3",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  historyCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  historySubtitle: {
    color: "#6B7280",
    fontSize: 12,
  },
  historyTitle: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  quotaCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quotaCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  quotaCta: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quotaCtaText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800",
  },
  quotaTitle: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  quotaValue: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
  headerCopy: {
    flex: 1,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
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
});
