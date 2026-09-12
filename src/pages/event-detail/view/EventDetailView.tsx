import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ShareSendResult } from "@/pages/home/components/SharePostSheet";
import type { FeedShareFriend } from "@/pages/home/types/feed.types";
import { fetchChatConversations, sendChatMessage } from "@/pages/messages/services/messages.service";
import {
  togglePublicProfileEventFavorite,
} from "@/pages/public-profile-events/services/public-profile-events.service";
import { hasValidCoordinates } from "@/lib/location";
import { formatEventPeriodLabel, resolvePeriodFromLegacy } from "@/lib/event-period";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { EventDetailGallery } from "../components/EventDetailGallery";
import { EventDetailHeader } from "../components/EventDetailHeader";
import { EventDetailHeroCard } from "../components/EventDetailHeroCard";
import { EventDetailInfoSection } from "../components/EventDetailInfoSection";
import { EventDetailListSection } from "../components/EventDetailListSection";
import { EventDetailOrganizer } from "../components/EventDetailOrganizer";
import { EventDetailParticipationFooter } from "../components/EventDetailParticipationFooter";
import { EventParticipationConfirmSheet } from "../components/EventParticipationConfirmSheet";
import { EventShareSheet } from "../components/EventShareSheet";
import { EventDetailTextSection } from "../components/EventDetailTextSection";
import { fetchEventDetail, joinEvent } from "../services/event-detail.service";
import type { EventDetail, EventDetailPlace } from "../types/event-detail.types";

type EventDetailViewProps = {
  eventId: string;
  onBack: () => void;
};

const DEFAULT_DESCRIPTION =
  "Confira as informações do evento, combine os detalhes com os participantes e prepare sua moto para a rota.";
const PARTICIPATION_FOOTER_BASE_HEIGHT = 156;

export function EventDetailView({ eventId, onBack }: EventDetailViewProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [shareFriends, setShareFriends] = useState<FeedShareFriend[]>([]);
  const [shareEvent, setShareEvent] = useState<EventDetail | null>(null);
  const [sentFriendId, setSentFriendId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isConfirmingPresence, setIsConfirmingPresence] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPresenceConfirmSheet, setShowPresenceConfirmSheet] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    try {
      const response = await fetchEventDetail(eventId);
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

  const loadShareFriends = useCallback(async () => {
    try {
      const data = await fetchChatConversations();
      setShareFriends(
        data.contacts.map((contact) => ({
          avatar: contact.userAvatar,
          firstName: contact.userName,
          id: contact.userId,
          isFriend: true,
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

  const places = useMemo(() => {
    const eventPlaces = event?.places ?? [];

    return {
      destination: eventPlaces.find((place) => place.role === "destination") ?? null,
      origin: eventPlaces.find((place) => place.role === "origin") ?? null,
      stops: eventPlaces.filter((place) => place.role === "stop"),
    };
  }, [event?.places]);

  const directionsTarget = useMemo(() => {
    const place =
      (hasValidCoordinates(places.origin) ? places.origin : places.destination) ??
      places.origin ??
      places.destination;
    if (!place) return null;

    return {
      label: place.mainText || place.description,
      latitude: place.latitude,
      longitude: place.longitude,
      placeId: place.placeId,
      subtitle: place.secondaryText || "",
    };
  }, [places.destination, places.origin]);

  const handleOpenDirections = useCallback(() => {
    if (
      !directionsTarget ||
      directionsTarget.latitude == null ||
      directionsTarget.longitude == null
    ) {
      Toast.show({
        type: "error",
        text1: "Localização indisponível",
        text2: "Este evento não possui coordenadas válidas para traçar a rota.",
      });
      return;
    }

    router.push({
      pathname: "/routes",
      params: {
        destinationLat: String(directionsTarget.latitude),
        destinationLng: String(directionsTarget.longitude),
        destinationPlaceId: directionsTarget.placeId,
        destinationSubtitle: directionsTarget.subtitle,
        destinationTitle: directionsTarget.label,
      },
    } as unknown as Href);
  }, [directionsTarget]);

  const handleToggleFavorite = useCallback(async () => {
    if (!event) return;
    const previousFavorited = event.isFavorited;
    setEvent((current) =>
      current ? { ...current, isFavorited: !current.isFavorited } : current,
    );

    try {
      const response = await togglePublicProfileEventFavorite(event.id);
      setEvent((current) =>
        current ? { ...current, isFavorited: response.favorited } : current,
      );
    } catch {
      setEvent((current) =>
        current ? { ...current, isFavorited: previousFavorited } : current,
      );
      Toast.show({
        type: "error",
        text1: "Não foi possível atualizar o favorito",
        text2: "Tente novamente em instantes.",
      });
    }
  }, [event]);

  const handleOpenPresenceConfirmation = useCallback(() => {
    if (!event) return;

    if (event.isParticipant) {
      Toast.show({
        type: "success",
        text1: "Presença confirmada",
        text2: "Você já está inscrito neste evento.",
      });
      return;
    }

    setShowPresenceConfirmSheet(true);
  }, [event]);

  const handleConfirmPresence = useCallback(async () => {
    if (!event || isConfirmingPresence) return;

    setIsConfirmingPresence(true);

    try {
      const response = await joinEvent(event.id);
      setEvent((current) =>
        current
          ? {
              ...current,
              isParticipant: response.isParticipant,
              participantsCount: response.participantsCount,
              remainingSpots: response.remainingSpots,
            }
          : current,
      );
      setShowPresenceConfirmSheet(false);
      Toast.show({
        type: "success",
        text1: "Presença confirmada",
        text2: "Você foi inscrito neste evento.",
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Não foi possível confirmar sua presença.";

      Toast.show({
        type: "error",
        text1: "Não foi possível participar",
        text2: message,
      });
    } finally {
      setIsConfirmingPresence(false);
    }
  }, [event, isConfirmingPresence]);

  const showParticipationFooter = Boolean(event && !event.isOwner);
  const participationFooterSpacerHeight = showParticipationFooter
    ? PARTICIPATION_FOOTER_BASE_HEIGHT + Math.max(insets.bottom, 12)
    : 0;

  return (
    <View style={styles.screen}>
      <EventDetailHeader onBack={onBack} />

      {isLoading ? (
        <FeedbackState loading message="Carregando evento..." />
      ) : null}

      {hasError ? (
        <FeedbackState icon="alert-circle-outline" message="Não foi possível carregar o evento." />
      ) : null}

      {!isLoading && !hasError && event ? (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <EventDetailHeroCard
              category={event.category}
              coverImageUrl={event.coverImageUrl}
              eventId={event.id}
              isFavorited={event.isFavorited}
              title={event.title}
              onShareWithFollower={openShareWithFollower}
              onToggleFavorite={() => void handleToggleFavorite()}
            />

            <EventDetailInfoSection
              canOpenDirections={hasValidCoordinates(directionsTarget)}
              dateLabel={formatEventPeriodDisplay(event)}
              destinationLabel={formatPlaceLabel(places.destination)}
              durationLabel={formatDurationLabel(event)}
              onOpenDirections={() => void handleOpenDirections()}
              originLabel={formatPlaceLabel(places.origin) || "A definir"}
              participantsCount={event.participantsCount}
              participantLimit={event.participantLimit}
              timeLabel={formatTimeLabel(event)}
              weekdayLabel={formatWeekdayLabel(event)}
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

            {showParticipationFooter ? (
              <View style={{ height: participationFooterSpacerHeight }} />
            ) : null}
          </ScrollView>

          {showParticipationFooter ? (
            <EventDetailParticipationFooter
              isParticipant={event.isParticipant}
              remainingSpots={event.remainingSpots}
              onPress={handleOpenPresenceConfirmation}
            />
          ) : null}

          <EventParticipationConfirmSheet
            dateLabel={formatEventPeriodDisplay(event)}
            isConfirming={isConfirmingPresence}
            locationLabel={formatPlaceLabel(places.origin) || "Local a definir"}
            timeLabel=""
            title={event.title}
            visible={showPresenceConfirmSheet}
            onClose={() => setShowPresenceConfirmSheet(false)}
            onConfirm={() => void handleConfirmPresence()}
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
  icon = "calendar-outline",
  loading = false,
  message,
}: FeedbackStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.feedbackWrap}>
      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} />
      ) : (
        <Ionicons color={colors.text.muted} name={icon} size={32} />
      )}
      <Text style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

function formatEventPeriodDisplay(event: EventDetail) {
  const period = resolvePeriodFromLegacy({
    date: event.date,
    endTime: event.endTime,
    endsAt: event.endsAt,
    startTime: event.startTime,
    startsAt: event.startsAt,
  });

  const label = formatEventPeriodLabel({
    endsAt: period.endsAt,
    endTime: event.endTime ?? period.endTime,
    startsAt: period.startsAt,
    startTime: event.startTime ?? period.startTime,
  });

  return label || "Data a definir";
}

function formatDurationLabel(event: EventDetail) {
  const period = resolvePeriodFromLegacy({
    date: event.date,
    endTime: event.endTime,
    endsAt: event.endsAt,
    startTime: event.startTime,
    startsAt: event.startsAt,
  });
  const startsAt = new Date(period.startsAt);
  const endsAt = new Date(period.endsAt);

  if (!Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime())) {
    const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
    if (durationMinutes > 0) return formatMinutesDuration(durationMinutes);
  }

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

function formatTimeLabel(event: EventDetail) {
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`;
  if (event.startTime) return event.startTime;

  const period = resolvePeriodFromLegacy({
    date: event.date,
    endTime: event.endTime,
    endsAt: event.endsAt,
    startTime: event.startTime,
    startsAt: event.startsAt,
  });

  if (period.startTime && period.endTime) return `${period.startTime} - ${period.endTime}`;
  if (period.startTime) return period.startTime;
  return "Horário a definir";
}

function formatWeekdayLabel(event: EventDetail) {
  const period = resolvePeriodFromLegacy({
    date: event.date,
    endTime: event.endTime,
    endsAt: event.endsAt,
    startTime: event.startTime,
    startsAt: event.startsAt,
  });
  const date = new Date(period.startsAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  }).format(date);
}

function getTimeDurationMinutes(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return null;

  const duration = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return duration > 0 ? duration : null;
}

const createStyles = (colors: AppColors) => ({
  content: {
    gap: 14,
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  feedbackText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  feedbackWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});
