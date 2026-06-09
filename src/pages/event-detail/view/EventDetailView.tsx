import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  togglePublicProfileEventFavorite,
} from "@/pages/public-profile-events/services/public-profile-events.service";
import { colors } from "@/theme/colors";

import { EventDetailGallery } from "../components/EventDetailGallery";
import { EventDetailHeader } from "../components/EventDetailHeader";
import { EventDetailHeroCard } from "../components/EventDetailHeroCard";
import { EventDetailInfoSection } from "../components/EventDetailInfoSection";
import { EventDetailListSection } from "../components/EventDetailListSection";
import { EventDetailOrganizer } from "../components/EventDetailOrganizer";
import { EventDetailParticipationFooter } from "../components/EventDetailParticipationFooter";
import { EventDetailTextSection } from "../components/EventDetailTextSection";
import { fetchEventDetail } from "../services/event-detail.service";
import type { EventDetail, EventDetailPlace } from "../types/event-detail.types";

type EventDetailViewProps = {
  eventId: string;
  onBack: () => void;
};

const DEFAULT_DESCRIPTION =
  "Confira as informações do evento, combine os detalhes com os participantes e prepare sua moto para a rota.";

export function EventDetailView({ eventId, onBack }: EventDetailViewProps) {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const places = useMemo(() => {
    const eventPlaces = event?.places ?? [];

    return {
      destination: eventPlaces.find((place) => place.role === "destination") ?? null,
      origin: eventPlaces.find((place) => place.role === "origin") ?? null,
      stops: eventPlaces.filter((place) => place.role === "stop"),
    };
  }, [event?.places]);

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

  const showParticipationFooter = Boolean(event && !event.isOwner);
  const bottomPadding = showParticipationFooter ? 190 : 28;

  return (
    <View style={styles.screen}>
      <EventDetailHeader topInset={insets.top} onBack={onBack} />

      {isLoading ? (
        <FeedbackState loading message="Carregando evento..." />
      ) : null}

      {hasError ? (
        <FeedbackState icon="alert-circle-outline" message="Não foi possível carregar o evento." />
      ) : null}

      {!isLoading && !hasError && event ? (
        <>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
          >
            <EventDetailHeroCard
              category={event.category}
              coverImageUrl={event.coverImageUrl}
              eventId={event.id}
              isFavorited={event.isFavorited}
              title={event.title}
              onToggleFavorite={() => void handleToggleFavorite()}
            />

            <EventDetailInfoSection
              dateLabel={formatDateLabel(event.date)}
              destinationLabel={formatPlaceLabel(places.destination)}
              durationLabel={formatDurationLabel(event)}
              originLabel={formatPlaceLabel(places.origin) || "A definir"}
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
          </ScrollView>

          {showParticipationFooter ? (
            <EventDetailParticipationFooter
              onPress={() => {
                Toast.show({
                  type: "success",
                  text1: "Participação",
                  text2: "A confirmação de presença será integrada em breve.",
                });
              }}
            />
          ) : null}
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

function formatDurationLabel(event: EventDetail) {
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
