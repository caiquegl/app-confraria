import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import type { ShareSendResult } from "@/pages/home/components/SharePostSheet";
import type { FeedShareFriend } from "@/pages/home/types/feed.types";
import {
  ensureRouteBackgroundTracking,
  stopRouteBackgroundTracking,
} from "@/lib/route-background-tracking";
import { routeTrackingLog } from "@/lib/route-tracking-logger";
import { fetchChatConversations, sendChatMessage } from "@/pages/messages/services/messages.service";
import { getCurrentUserId } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/password-reset";
import { colors } from "@/theme/colors";

import { RouteDetailMap } from "../components/RouteDetailMap";
import { RouteGuestsSection } from "../components/RouteGuestsSection";
import { RouteShareSheet } from "../components/RouteShareSheet";
import { useRouteDirections } from "../hooks/useRouteDirections";
import {
  deleteRoute,
  fetchRoute,
  removeRouteStop,
  respondToRouteInvitation,
  updateRouteStatus,
} from "../services/routes.service";
import type { RouteApiResponse, RouteDayApiResponse, RoutePlaceResponse } from "../types/saved-route.types";
import { mapApiRouteToEditSnapshot } from "../utils/map-api-route-to-edit";
import { formatRouteDistance, formatRouteDuration } from "../utils/route-format.utils";
import {
  formatRouteDateTime,
  getRouteEffectiveStartedAt,
  getRouteTripDurationSeconds,
} from "../utils/route-trip-time.utils";
import { buildMapMarkersFromDraft } from "../utils/route-draft.utils";

type RouteDetailViewProps = {
  onBack: () => void;
  routeId: string;
};

type DetailTab = "geral" | "dias";

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return `R$ ${value.toFixed(2)}`;
}

function formatTripDate(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "Sem data agendada";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTripTime(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
}

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPlaceKindColor(role: RoutePlaceResponse["role"]): string {
  if (role === "origin") return colors.brandGreen;
  if (role === "destination") return colors.brandDark;
  return "#D1D5DB";
}

function getRoutePlaceKey(
  dayId: string,
  place: RoutePlaceResponse,
  index: number,
): string {
  return `${dayId}-${place.id || `${place.role}-${place.order}-${index}`}`;
}

function DayItineraryCard({ day }: { day: RouteDayApiResponse }) {
  const places = [...day.places].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.itineraryCard}>
      <Text style={styles.itineraryCardTitle}>{day.label}</Text>
      <View style={styles.itineraryPlaces}>
        {places.length === 0 ? (
          <Text style={styles.emptyPlacesText}>Sem paradas neste dia.</Text>
        ) : (
          places.map((place, index) => (
            <View key={getRoutePlaceKey(day.id, place, index)} style={styles.itineraryPlaceRow}>
              <View
                style={[styles.itineraryDot, { backgroundColor: getPlaceKindColor(place.role) }]}
              />
              <Text numberOfLines={2} style={styles.itineraryPlaceText}>
                {place.mainText || place.description}
              </Text>
            </View>
          ))
        )}
      </View>
      <Text style={styles.itineraryMeta}>
        {formatRouteDistance(day.distanceMeters)} • {formatRouteDuration(day.durationSeconds)}
      </Text>
    </View>
  );
}

function FinancialCard({
  icon,
  subtitle,
  title,
  value,
  variant = "default",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  title: string;
  value: string;
  variant?: "default" | "highlight";
}) {
  return (
    <View style={[styles.financialCard, variant === "highlight" && styles.financialCardHighlight]}>
      <View
        style={[
          styles.financialIcon,
          variant === "highlight" && styles.financialIconHighlight,
        ]}
      >
        <Ionicons
          color={variant === "highlight" ? colors.brandDark : "#6B7280"}
          name={icon}
          size={18}
        />
      </View>
      <Text style={styles.financialLabel}>{title}</Text>
      <Text style={styles.financialValue}>{value}</Text>
      <Text style={styles.financialSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function RouteDetailView({ onBack, routeId }: RouteDetailViewProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [route, setRoute] = useState<RouteApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("geral");
  const [showOptions, setShowOptions] = useState(false);
  const [shareFriends, setShareFriends] = useState<FeedShareFriend[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [sentFriendId, setSentFriendId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const dayCarouselWidth = Math.min(340, screenWidth - 48);
  const canModifyStops = route?.status === "scheduled";
  const hasDays = (route?.days.length ?? 0) > 0;
  const isInProgress = route?.status === "in_progress";
  const isFinished = route?.status === "finished";
  const isScheduled = route?.status === "scheduled";
  const isOwner =
    route?.isOwner === true ||
    (currentUserId != null && route?.createdById === currentUserId);
  const isParticipant =
    route?.isParticipant === true ||
    (currentUserId != null &&
      (route?.participants ?? []).some((participant) => participant.userId === currentUserId));
  const hasPendingInvitation =
    route?.invitation?.status === "pending" && !isOwner && !isParticipant;
  const canUseRouteActions = isOwner || isParticipant;

  const draftDays = useMemo(
    () => (route ? mapApiRouteToEditSnapshot(route).draft.itinerary.days : []),
    [route],
  );

  const directions = useRouteDirections({
    activeDayId: draftDays[0]?.id ?? "",
    avoidTolls: route?.avoidTolls ?? false,
    days: draftDays,
  });

  const mapMarkers = useMemo(() => buildMapMarkersFromDraft(draftDays), [draftDays]);

  const totalCost = (route?.fuelCost ?? 0) + (route?.tollCost ?? 0);
  const hasAnyCost = route?.fuelCost != null || route?.tollCost != null;

  const loadRoute = useCallback(async () => {
    if (!routeId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    try {
      const response = await fetchRoute(routeId);
      setRoute(response);
    } catch {
      setHasError(true);
      setRoute(null);
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    void getCurrentUserId().then(setCurrentUserId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRoute();
    }, [loadRoute]),
  );

  const loadShareFriends = useCallback(async () => {
    try {
      const data = await fetchChatConversations();
      setShareFriends(
        data.contacts.map((contact) => ({
          avatar: contact.userAvatar,
          firstName: contact.userName,
          id: contact.userId,
          isFriend: true,
          isPremium: false,
          location: "Confraria",
          userId: contact.userId,
        })),
      );
    } catch {
      setShareFriends([]);
    }
  }, []);

  const openShare = useCallback(() => {
    setIsShareOpen(true);
    setSentFriendId(null);
    void loadShareFriends();
  }, [loadShareFriends]);

  const openInvite = useCallback(() => {
    setIsInviteOpen(true);
    setSentFriendId(null);
    void loadShareFriends();
  }, [loadShareFriends]);

  const inviteToFriend = useCallback(
    async (friendId: string): Promise<ShareSendResult | null> => {
      if (!route) return null;

      const result = await sendChatMessage({
        recipientId: friendId,
        sharedRouteId: route.id,
        text: `Convite para o passeio: ${route.title}`,
      });

      setSentFriendId(friendId);
      const updatedRoute = await fetchRoute(route.id);
      setRoute(updatedRoute);

      const friend = shareFriends.find((item) => item.id === friendId);

      return {
        conversationId: result.senderConversation.id,
        participantAvatar:
          friend?.avatar ?? result.senderConversation.participant.userAvatar,
        participantName:
          friend?.firstName ?? result.senderConversation.participant.userName,
      };
    },
    [route, shareFriends],
  );

  const handleRespondInvitation = async (accept: boolean) => {
    if (!route || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await respondToRouteInvitation(route.id, accept);
      setRoute(updated);
      Toast.show({
        text1: accept ? "Convite aceito" : "Convite recusado",
        type: "success",
      });
    } catch (error) {
      Toast.show({
        text1: "Não foi possível responder ao convite",
        text2: getApiErrorMessage(error, "Tente novamente em instantes."),
        type: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const shareToFriend = useCallback(
    async (friendId: string): Promise<ShareSendResult | null> => {
      if (!route) return null;

      const result = await sendChatMessage({
        recipientId: friendId,
        sharedRouteId: route.id,
        text: route.title || "Compartilhou uma rota com você",
      });

      setSentFriendId(friendId);
      const friend = shareFriends.find((item) => item.id === friendId);

      return {
        conversationId: result.senderConversation.id,
        participantAvatar:
          friend?.avatar ?? result.senderConversation.participant.userAvatar,
        participantName:
          friend?.firstName ?? result.senderConversation.participant.userName,
      };
    },
    [route, shareFriends],
  );

  const handleResumeNavigation = async () => {
    if (!route || isUpdatingStatus) return;

    routeTrackingLog.info("RouteDetailView:resume-navigation-pressed", {
      routeId: route.id,
      status: route.status,
      title: route.title,
    });

    try {
      const result = await ensureRouteBackgroundTracking(route.id, route.title);
      routeTrackingLog.info("RouteDetailView:resume-navigation-pressed:done", {
        routeId: route.id,
        wasAlreadyActive: result.wasAlreadyActive,
      });
    } catch (error) {
      routeTrackingLog.error("RouteDetailView:resume-navigation-pressed:failed", error, {
        routeId: route.id,
      });
      Toast.show({
        text1: "Rastreamento em segundo plano",
        text2: getApiErrorMessage(
          error,
          "Permita localização em segundo plano para continuar rastreado ao sair do app.",
        ),
        type: "error",
      });
    }

    router.push(`/routes/${route.id}/navigate` as Href);
  };

  const handleStartRoute = async () => {
    if (!route || isUpdatingStatus) return;

    routeTrackingLog.info("RouteDetailView:start-route-pressed", {
      routeId: route.id,
      title: route.title,
    });

    setIsUpdatingStatus(true);

    try {
      const updated = await updateRouteStatus(route.id, "in_progress");
      setRoute(updated);

      try {
        const result = await ensureRouteBackgroundTracking(updated.id, updated.title);
        routeTrackingLog.info("RouteDetailView:start-route-pressed:tracking-done", {
          routeId: updated.id,
          wasAlreadyActive: result.wasAlreadyActive,
        });
      } catch (trackingError) {
        routeTrackingLog.error("RouteDetailView:start-route-pressed:tracking-failed", trackingError, {
          routeId: updated.id,
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

      router.push(`/routes/${route.id}/navigate` as Href);
    } catch (error) {
      Toast.show({
        text1: "Não foi possível iniciar o passeio",
        text2: getApiErrorMessage(error, "Tente novamente em instantes."),
        type: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFinishRoute = async () => {
    if (!route || isUpdatingStatus || !isOwner) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await updateRouteStatus(route.id, "finished");
      setRoute(updated);
      await stopRouteBackgroundTracking();
      Toast.show({
        text1: "Rota finalizada",
        type: "success",
      });
    } catch (error) {
      Toast.show({
        text1: "Não foi possível atualizar a rota",
        text2: getApiErrorMessage(error, "Tente novamente em instantes."),
        type: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePrimaryAction = () => {
    if (!route || isUpdatingStatus) return;

    routeTrackingLog.info("RouteDetailView:primary-action-pressed", {
      isInProgress,
      routeId: route.id,
      status: route.status,
    });

    if (isInProgress) {
      void handleResumeNavigation();
      return;
    }

    void handleStartRoute();
  };

  const handleFinishFromMenu = async () => {
    if (!route || !isInProgress) return;
    setShowOptions(false);
    await handleFinishRoute();
  };

  const handleEdit = () => {
    if (!route) return;
    setShowOptions(false);
    router.push(`/routes/edit?routeId=${route.id}` as Href);
  };

  const confirmDelete = () => {
    if (!route) return;
    setShowOptions(false);

    Alert.alert(
      "Excluir rota",
      "Tem certeza que deseja excluir esta rota? Essa ação não pode ser desfeita.",
      [
        { style: "cancel", text: "Cancelar" },
        {
          style: "destructive",
          text: "Excluir",
          onPress: () => {
            void (async () => {
              try {
                await deleteRoute(route.id);
                Toast.show({ text1: "Rota excluída", type: "success" });
                onBack();
              } catch (error) {
                Toast.show({
                  text1: "Não foi possível excluir a rota",
                  text2: getApiErrorMessage(error, "Tente novamente em instantes."),
                  type: "error",
                });
              }
            })();
          },
        },
      ],
    );
  };

  const handleRemoveStop = (dayId: string, placeId: string) => {
    Alert.alert("Remover parada", "Deseja remover esta parada do dia?", [
      { style: "cancel", text: "Cancelar" },
      {
        style: "destructive",
        text: "Remover",
        onPress: () => {
          void (async () => {
            try {
              const updated = await removeRouteStop(dayId, placeId);
              setRoute(updated);
              Toast.show({ text1: "Parada removida", type: "success" });
            } catch (error) {
              Toast.show({
                text1: "Não foi possível remover a parada",
                text2: getApiErrorMessage(error, "Tente novamente em instantes."),
                type: "error",
              });
            }
          })();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brandDark} size="large" />
      </View>
    );
  }

  if (hasError || !route) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Não foi possível carregar a rota</Text>
        <Button size="default" onPress={() => void loadRoute()}>
          Tentar novamente
        </Button>
      </View>
    );
  }


  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" style={styles.headerButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={18} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {route.title}
        </Text>
        <Pressable accessibilityRole="button" style={styles.headerButton} onPress={openShare}>
          <Ionicons color={colors.brandDark} name="share-social-outline" size={16} />
        </Pressable>
        {!isFinished ? (
          <View>
            <Pressable
              accessibilityRole="button"
              style={styles.headerButton}
              onPress={() => setShowOptions((current) => !current)}
            >
              <Ionicons color={colors.brandDark} name="ellipsis-vertical" size={16} />
            </Pressable>

            {showOptions ? (
              <View style={styles.optionsMenu}>
                {isScheduled ? (
                  <Pressable style={styles.optionsItem} onPress={handleEdit}>
                    <Ionicons color="#9CA3AF" name="create-outline" size={15} />
                    <Text style={styles.optionsItemText}>Editar</Text>
                  </Pressable>
                ) : null}
                {isInProgress && isOwner ? (
                  <>
                    <View style={styles.optionsDivider} />
                    <Pressable style={styles.optionsItem} onPress={() => void handleFinishFromMenu()}>
                      <Ionicons color="#9CA3AF" name="checkmark-circle-outline" size={15} />
                      <Text style={styles.optionsItemText}>Finalizar rota</Text>
                    </Pressable>
                  </>
                ) : null}
                {isScheduled ? (
                  <>
                    <View style={styles.optionsDivider} />
                    <Pressable style={styles.optionsItemDanger} onPress={confirmDelete}>
                      <Ionicons color="#EF4444" name="trash-outline" size={15} />
                      <Text style={styles.optionsItemDangerText}>Excluir</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "geral" && styles.tabActive]}
          onPress={() => setActiveTab("geral")}
        >
          <Text style={[styles.tabText, activeTab === "geral" && styles.tabTextActive]}>Geral</Text>
        </Pressable>
        {hasDays ? (
          <Pressable
            style={[styles.tab, activeTab === "dias" && styles.tabActive]}
            onPress={() => setActiveTab("dias")}
          >
            <Text style={[styles.tabText, activeTab === "dias" && styles.tabTextActive]}>Dias</Text>
          </Pressable>
        ) : null}
      </View>

      {activeTab === "geral" ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 88 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mapCard}>
            <RouteDetailMap
              markers={mapMarkers}
              routeCoordinates={directions.selectedCoordinates}
            />
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayLabel}>Trajeto</Text>
              <Text style={styles.mapOverlayValue}>
                {route.days.length} dia{route.days.length === 1 ? "" : "s"} •{" "}
                {formatRouteDistance(route.distanceMeters)}
              </Text>
            </View>
          </View>

          <View style={styles.scheduleCard}>
            <View style={styles.scheduleIcon}>
              <Ionicons color={colors.brandGreen} name="calendar-outline" size={18} />
            </View>
            <View style={styles.scheduleCopy}>
              <Text style={styles.scheduleLabel}>Saída</Text>
              <Text style={styles.scheduleValue}>
                {formatTripDate(route.startsAt)}
                {formatTripTime(route.startsAt) ? ` às ${formatTripTime(route.startsAt)}` : ""}
              </Text>
              <Text style={styles.scheduleMeta}>Criado em {formatCreatedAt(route.createdAt)}</Text>
              {getRouteEffectiveStartedAt(route) ? (
                <Text style={styles.scheduleMeta}>
                  Iniciado em {formatRouteDateTime(getRouteEffectiveStartedAt(route))}
                </Text>
              ) : null}
              {route.finishedAt ? (
                <Text style={styles.scheduleMeta}>
                  Finalizado em {formatRouteDateTime(route.finishedAt)}
                  {route.status === "finished"
                    ? ` • Duração ${formatRouteDuration(getRouteTripDurationSeconds(route))}`
                    : ""}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {route.originLabel} → {route.destinationLabel}
            </Text>
            <Text style={styles.summarySubtitle}>{route.title}</Text>
            <View style={styles.summaryMetaRow}>
              <Text style={styles.summaryMeta}>{formatRouteDistance(route.distanceMeters)}</Text>
              <Text style={styles.summaryMetaDot}>•</Text>
              <Text style={styles.summaryMeta}>{route.bike.name}</Text>
              <Text style={styles.summaryMetaDot}>•</Text>
              <Text style={styles.summaryMeta}>{formatRouteDuration(route.durationSeconds)}</Text>
              <Text style={styles.summaryMetaDot}>•</Text>
              <Text style={styles.summaryMeta}>
                {route.days.length} dia{route.days.length === 1 ? "" : "s"}
              </Text>
            </View>
            {route.avoidTolls || route.optimizeFuel ? (
              <View style={styles.preferenceRow}>
                {route.avoidTolls ? (
                  <View style={styles.preferenceChip}>
                    <Text style={styles.preferenceChipText}>Sem pedágio</Text>
                  </View>
                ) : null}
                {route.optimizeFuel ? (
                  <View style={styles.preferenceChip}>
                    <Text style={styles.preferenceChipText}>Economizar combustível</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {route.days.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Itinerário</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {route.days.map((day) => (
                  <DayItineraryCard key={day.id} day={day} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo financeiro</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <FinancialCard
                icon="star"
                subtitle="Pedágio + combustível"
                title="Total da rota"
                value={hasAnyCost ? formatCurrency(totalCost) : "—"}
                variant="highlight"
              />
              <FinancialCard
                icon="navigate-outline"
                subtitle="Estimativa de pedágios"
                title="Pedágios"
                value={formatCurrency(route.tollCost)}
              />
              <FinancialCard
                icon="water-outline"
                subtitle="Estimativa total"
                title="Combustível"
                value={formatCurrency(route.fuelCost)}
              />
            </ScrollView>
          </View>

          {route.tripNote ? (
            <View style={styles.noteCard}>
              <Text style={styles.noteLabel}>Recado para os Confrades</Text>
              <Text style={styles.noteText}>{route.tripNote}</Text>
            </View>
          ) : null}

          {isOwner && !isFinished ? (
            <View style={styles.section}>
              <RouteGuestsSection
                participants={route.participants ?? []}
                pendingInvites={route.pendingInvites ?? []}
                onInvite={openInvite}
              />
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {activeTab === "dias" && hasDays ? (
        <View style={styles.daysTab}>
          <FlatList
          horizontal
          data={route.days}
          decelerationRate="fast"
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={dayCarouselWidth + 16}
          contentContainerStyle={styles.daysCarousel}
          renderItem={({ item: day }) => {
            const places = [...day.places].sort((a, b) => a.order - b.order);

            return (
              <View style={[styles.dayCard, { width: dayCarouselWidth }]}>
                <View style={styles.dayCardHeader}>
                  <View style={styles.dayCardHeaderLeft}>
                    <Ionicons color="#9CA3AF" name="calendar-outline" size={14} />
                    <Text style={styles.dayCardTitle}>{day.label}</Text>
                    <Text style={styles.dayCardDistance}>
                      {formatRouteDistance(day.distanceMeters)}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  contentContainerStyle={styles.dayCardBody}
                  nestedScrollEnabled
                  style={styles.dayCardScroll}
                >
                  {places.length === 0 ? (
                    <Text style={styles.emptyPlacesText}>Sem paradas neste dia.</Text>
                  ) : (
                    places.map((place, index) => (
                      <View
                        key={getRoutePlaceKey(day.id, place, index)}
                        style={styles.dayStopRow}
                      >
                        <View
                          style={[
                            styles.itineraryDot,
                            { backgroundColor: getPlaceKindColor(place.role) },
                          ]}
                        />
                        <Text numberOfLines={2} style={styles.dayStopText}>
                          {place.mainText || place.description}
                        </Text>
                        {canModifyStops && place.role === "stop" ? (
                          <Pressable
                            hitSlop={8}
                            onPress={() => handleRemoveStop(day.id, place.id)}
                          >
                            <Ionicons color="#EF4444" name="trash-outline" size={16} />
                          </Pressable>
                        ) : null}
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            );
          }}
        />
        </View>
      ) : null}

      {activeTab === "geral" && hasPendingInvitation ? (
        <View style={styles.footer}>
          <View style={styles.invitationActions}>
            <Button
              disabled={isUpdatingStatus}
              size="lg"
              style={styles.invitationSecondaryButton}
              variant="secondary"
              onPress={() => void handleRespondInvitation(false)}
            >
              Recusar
            </Button>
            <Button
              disabled={isUpdatingStatus}
              size="lg"
              style={styles.invitationPrimaryButton}
              onPress={() => void handleRespondInvitation(true)}
            >
              {isUpdatingStatus ? "Atualizando..." : "Aceitar convite"}
            </Button>
          </View>
        </View>
      ) : null}

      {activeTab === "geral" && canUseRouteActions && !isFinished && !hasPendingInvitation ? (
        <View style={styles.footer}>
          <Button
            disabled={isUpdatingStatus}
            size="lg"
            onPress={() => handlePrimaryAction()}
          >
            {isUpdatingStatus
              ? "Atualizando..."
              : isInProgress
                ? "Voltar para a rota"
                : "Iniciar o passeio"}
          </Button>
        </View>
      ) : null}

      {showOptions && !isFinished ? (
        <Pressable style={styles.optionsBackdrop} onPress={() => setShowOptions(false)} />
      ) : null}

      <RouteShareSheet
        friends={shareFriends}
        mode="share"
        route={
          isShareOpen
            ? {
                destinationLabel: route.destinationLabel,
                originLabel: route.originLabel,
                title: route.title,
              }
            : null
        }
        sentFriendId={sentFriendId}
        onClose={() => {
          setIsShareOpen(false);
          setSentFriendId(null);
        }}
        onSendToFriend={shareToFriend}
      />

      <RouteShareSheet
        friends={shareFriends}
        mode="invite"
        route={
          isInviteOpen
            ? {
                destinationLabel: route.destinationLabel,
                originLabel: route.originLabel,
                title: route.title,
              }
            : null
        }
        sentFriendId={sentFriendId}
        onClose={() => {
          setIsInviteOpen(false);
          setSentFriendId(null);
        }}
        onSendToFriend={inviteToFriend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    height: "100%",
    overflow: "hidden",
  },
  dayCardBody: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayCardDistance: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  dayCardHeader: {
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayCardHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  dayCardScroll: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  dayCardTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  daysCarousel: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  daysTab: {
    flex: 1,
  },
  dayStopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  dayStopText: {
    color: "#4B5563",
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyPlacesText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
  errorTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  financialCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    padding: 16,
    width: 180,
  },
  financialCardHighlight: {
    backgroundColor: "rgba(200, 247, 99, 0.12)",
    borderColor: colors.brandGreen,
  },
  financialIcon: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    marginBottom: 12,
    width: 36,
  },
  financialIconHighlight: {
    backgroundColor: "rgba(200, 247, 99, 0.25)",
  },
  financialLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    marginBottom: 4,
  },
  financialSubtitle: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 8,
  },
  financialValue: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
  footer: {
    backgroundColor: colors.brandGray,
    bottom: 0,
    left: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: "absolute",
    right: 0,
  },
  invitationActions: {
    flexDirection: "row",
    gap: 12,
  },
  invitationPrimaryButton: {
    flex: 1,
  },
  invitationSecondaryButton: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  headerTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  itineraryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    maxWidth: 240,
    minWidth: 220,
    padding: 12,
  },
  itineraryCardTitle: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  itineraryDot: {
    borderRadius: 999,
    height: 8,
    marginTop: 4,
    width: 8,
  },
  itineraryMeta: {
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 8,
    paddingTop: 8,
  },
  itineraryPlaceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  itineraryPlaces: {
    maxHeight: 160,
  },
  itineraryPlaceText: {
    color: "#4B5563",
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 224,
    overflow: "hidden",
  },
  mapOverlay: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    top: 16,
  },
  mapOverlayLabel: {
    color: "#728F21",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mapOverlayValue: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  noteCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  noteLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    marginBottom: 4,
  },
  noteText: {
    color: colors.brandDark,
    fontSize: 14,
    lineHeight: 20,
  },
  optionsBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 15,
  },
  optionsDivider: {
    backgroundColor: "#F3F4F6",
    height: 1,
    marginHorizontal: 12,
  },
  optionsItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsItemDanger: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsItemDangerText: {
    color: "#EF4444",
    fontSize: 14,
  },
  optionsItemText: {
    color: colors.brandDark,
    fontSize: 14,
  },
  optionsMenu: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 160,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    top: 44,
    zIndex: 30,
  },
  preferenceChip: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  preferenceChipText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "600",
  },
  preferenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  scheduleCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  scheduleCopy: {
    flex: 1,
  },
  scheduleIcon: {
    alignItems: "center",
    backgroundColor: "rgba(200, 247, 99, 0.15)",
    borderRadius: 16,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  scheduleLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    marginBottom: 2,
  },
  scheduleMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  scheduleValue: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    padding: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  summaryMeta: {
    color: "#6B7280",
    fontSize: 12,
  },
  summaryMetaDot: {
    color: "#D1D5DB",
    fontSize: 12,
  },
  summaryMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  summarySubtitle: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  summaryTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
  tab: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomColor: colors.brandDark,
    borderBottomWidth: 2,
  },
  tabs: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  tabText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  tabTextActive: {
    color: colors.brandDark,
  },
});
