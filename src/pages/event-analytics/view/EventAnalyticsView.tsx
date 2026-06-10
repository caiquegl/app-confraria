import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EventDetailGallery } from "@/pages/event-detail/components/EventDetailGallery";
import { EventDetailInfoSection } from "@/pages/event-detail/components/EventDetailInfoSection";
import { EventDetailListSection } from "@/pages/event-detail/components/EventDetailListSection";
import { EventDetailOrganizer } from "@/pages/event-detail/components/EventDetailOrganizer";
import { EventShareSheet } from "@/pages/event-detail/components/EventShareSheet";
import { EventDetailTextSection } from "@/pages/event-detail/components/EventDetailTextSection";
import type { EventDetailPlace } from "@/pages/event-detail/types/event-detail.types";
import type { ShareSendResult } from "@/pages/home/components/SharePostSheet";
import type { FeedShareFriend } from "@/pages/home/types/feed.types";
import { fetchChatConversations, sendChatMessage } from "@/pages/messages/services/messages.service";
import { colors } from "@/theme/colors";

import { EventAnalyticsHeader } from "../components/EventAnalyticsHeader";
import { EventAnalyticsHeroCard } from "../components/EventAnalyticsHeroCard";
import { EventAnalyticsTabs } from "../components/EventAnalyticsTabs";
import { EventMetricCard } from "../components/EventMetricCard";
import { EventOccupancyCard } from "../components/EventOccupancyCard";
import { EventOwnerActionsFooter } from "../components/EventOwnerActionsFooter";
import { EventParticipantsList } from "../components/EventParticipantsList";
import { fetchEventAnalytics } from "../services/event-analytics.service";
import type { EventAnalytics, EventAnalyticsTab } from "../types/event-analytics.types";

type EventAnalyticsViewProps = {
  eventId: string;
  onBack: () => void;
};

const DEFAULT_DESCRIPTION =
  "Confira as informações do evento, acompanhe as inscrições e compartilhe com seus seguidores.";
const FOOTER_BASE_HEIGHT = 92;

export function EventAnalyticsView({ eventId, onBack }: EventAnalyticsViewProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<EventAnalyticsTab>("analiticas");
  const [event, setEvent] = useState<EventAnalytics | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sentFriendId, setSentFriendId] = useState<string | null>(null);
  const [shareEvent, setShareEvent] = useState<EventAnalytics | null>(null);
  const [shareFriends, setShareFriends] = useState<FeedShareFriend[]>([]);

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    try {
      const response = await fetchEventAnalytics(eventId);
      setEvent(response);
    } catch {
      setHasError(true);
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadEvent();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadEvent]);

  const places = useMemo(() => {
    const eventPlaces = event?.places ?? [];

    return {
      destination: eventPlaces.find((place) => place.role === "destination") ?? null,
      origin: eventPlaces.find((place) => place.role === "origin") ?? null,
      stops: eventPlaces.filter((place) => place.role === "stop"),
    };
  }, [event?.places]);

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

  const openShareWithFollower = useCallback(() => {
    if (!event) return;
    setShareEvent(event);
    setSentFriendId(null);
    void loadShareFriends();
  }, [event, loadShareFriends]);

  const closeShareWithFollower = useCallback(() => {
    setShareEvent(null);
    setSentFriendId(null);
  }, []);

  const shareToFriend = useCallback(
    async (friendId: string): Promise<ShareSendResult | null> => {
      if (!shareEvent) return null;

      const result = await sendChatMessage({
        recipientId: friendId,
        sharedEventId: shareEvent.id,
        text: shareEvent.title || "Compartilhou um evento com você",
      });

      setSentFriendId(friendId);
      const friend = shareFriends.find((item) => item.id === friendId);

      return {
        conversationId: result.senderConversation.id,
        participantAvatar: friend?.avatar ?? result.senderConversation.participant.userAvatar,
        participantName: friend?.firstName ?? result.senderConversation.participant.userName,
      };
    },
    [shareEvent, shareFriends],
  );

  const showUnavailableActionToast = useCallback((action: string) => {
    Toast.show({
      type: "info",
      text1: `${action} em breve`,
      text2: "Essa ação ainda não possui endpoint integrado.",
    });
  }, []);

  const footerSpacerHeight = FOOTER_BASE_HEIGHT + Math.max(insets.bottom, 12);
  const canRenderOwnerPage = Boolean(event?.isOwner);

  return (
    <View style={styles.screen}>
      <EventAnalyticsHeader
        topInset={insets.top}
        onBack={onBack}
        onDeleteEvent={() => showUnavailableActionToast("Exclusão")}
        onEditEvent={() => showUnavailableActionToast("Edição")}
      />

      {isLoading ? (
        <FeedbackState loading message="Carregando analytics do evento..." />
      ) : null}

      {hasError ? (
        <FeedbackState icon="alert-circle-outline" message="Não foi possível carregar o evento." />
      ) : null}

      {!isLoading && !hasError && event && !canRenderOwnerPage ? (
        <FeedbackState
          icon="lock-closed-outline"
          message="Você não tem permissão para gerenciar este evento."
        />
      ) : null}

      {!isLoading && !hasError && event && canRenderOwnerPage ? (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: footerSpacerHeight + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <EventAnalyticsHeroCard
              category={event.category}
              coverImageUrl={event.coverImageUrl}
              title={event.title}
            />

            <EventAnalyticsTabs activeTab={activeTab} onChangeTab={setActiveTab} />

            {activeTab === "detalhes" ? (
              <View style={styles.sections}>
                <EventDetailInfoSection
                  dateLabel={formatDateLabel(event.date)}
                  destinationLabel={formatPlaceLabel(places.destination)}
                  durationLabel={formatDurationLabel(event)}
                  originLabel={formatPlaceLabel(places.origin) || "A definir"}
                  participantsCount={event.participantsCount}
                  participantLimit={event.participantLimit}
                  timeLabel={formatTimeLabel(event)}
                  weekdayLabel={formatWeekdayLabel(event.date)}
                />

                <EventDetailTextSection
                  text={event.description?.trim() || DEFAULT_DESCRIPTION}
                  title="Sobre o Evento"
                />

                <EventDetailGallery imageUrls={event.galleryImageUrls} />

                <EventDetailListSection
                  items={event.included}
                  title="O que está incluído"
                />

                <EventDetailListSection items={event.requirements} title="Requisitos" />

                {places.stops.length > 0 ? (
                  <EventDetailListSection
                    items={places.stops.map(formatPlaceLabel).filter(Boolean)}
                    title="Paradas"
                  />
                ) : null}

                <EventDetailOrganizer
                  avatarUrl={event.organizer.avatarUrl}
                  name={event.organizer.name}
                />
              </View>
            ) : (
              <View style={styles.sections}>
                <EventOccupancyCard
                  participantLimit={event.participantLimit}
                  participantsCount={event.participantsCount}
                />

                <EventMetricCard
                  delta="7 dias"
                  icon={<Ionicons color="#15803D" name="trending-up-outline" size={18} />}
                  label="Ritmo de inscrições"
                  value={`+${event.signupsLast7Days}`}
                >
                  <Text style={styles.metricHelper}>
                    novas inscrições nos últimos 7 dias
                  </Text>
                </EventMetricCard>

                <EventParticipantsList
                  participants={event.participants}
                  participantsCount={event.participantsCount}
                />
              </View>
            )}
          </ScrollView>

          <EventOwnerActionsFooter
            eventId={event.id}
            title={event.title}
            onShareWithFollower={openShareWithFollower}
          />

          <EventShareSheet
            event={
              shareEvent
                ? {
                    category: shareEvent.category,
                    coverImageUrl: shareEvent.coverImageUrl,
                    organizerName: shareEvent.organizer.name,
                    title: shareEvent.title,
                  }
                : null
            }
            friends={shareFriends}
            sentFriendId={sentFriendId}
            onClose={closeShareWithFollower}
            onSent={(result) => {
              closeShareWithFollower();
              router.push({
                pathname: "/messages/[conversationId]",
                params: {
                  conversationId: result.conversationId,
                  participantAvatar: result.participantAvatar ?? "",
                  participantName: result.participantName,
                },
              });
            }}
            onSendToFriend={shareToFriend}
          />
        </>
      ) : null}
    </View>
  );
}

type FeedbackStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  message: string;
};

function FeedbackState({
  icon = "analytics-outline",
  loading = false,
  message,
}: FeedbackStateProps) {
  return (
    <View style={styles.feedbackWrap}>
      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} />
      ) : (
        <Ionicons color="#9CA3AF" name={icon} size={32} />
      )}
      <Text style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data a definir";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDurationLabel(event: EventAnalytics) {
  if (event.startTime && event.endTime) {
    const duration = getTimeDurationMinutes(event.startTime, event.endTime);
    if (duration) return formatMinutesDuration(duration);
  }

  if (event.routeDurationSeconds) {
    return formatMinutesDuration(Math.round(event.routeDurationSeconds / 60));
  }

  return "Duração a definir";
}

function formatMinutesDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) return `${hours}h${String(remainingMinutes).padStart(2, "0")} de duração`;
  if (hours) return `${hours}h de duração`;
  return `${minutes}min de duração`;
}

function formatPlaceLabel(place: EventDetailPlace | null) {
  if (!place) return "";
  return place.mainText || place.description;
}

function formatTimeLabel(event: EventAnalytics) {
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`;
  if (event.startTime) return event.startTime;
  return "Horário a definir";
}

function formatWeekdayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

function getTimeDurationMinutes(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return null;

  const duration = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return duration > 0 ? duration : null;
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  feedbackText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  feedbackWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  metricHelper: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  sections: {
    gap: 14,
  },
});
