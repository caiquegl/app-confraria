import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";

import {
  fetchCreatedPublicProfileEvents,
  fetchJoinedPublicProfileEvents,
} from "@/pages/public-profile-events/services/public-profile-events.service";
import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";

export function usePublicProfileGridEvents(userId: string) {
  const mountedRef = useRef(true);
  const [createdEventIds, setCreatedEventIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [events, setEvents] = useState<PublicProfileEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadEvents = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const [createdEvents, joinedEvents] = await Promise.all([
        fetchCreatedPublicProfileEvents(userId),
        fetchJoinedPublicProfileEvents(userId),
      ]);

      if (!mountedRef.current) return;

      const nextCreatedEventIds = new Set(createdEvents.map((event) => event.id));
      const eventsById = new Map<string, PublicProfileEvent>();

      [...createdEvents, ...joinedEvents].forEach((event) => {
        if (!eventsById.has(event.id)) {
          eventsById.set(event.id, event);
        }
      });

      setCreatedEventIds(nextCreatedEventIds);
      setEvents(Array.from(eventsById.values()));
    } catch {
      if (!mountedRef.current) return;
      setCreatedEventIds(new Set());
      setEvents([]);
      Toast.show({
        type: "error",
        text1: "Erro ao carregar eventos",
        text2: "Não foi possível buscar os eventos deste perfil.",
      });
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadEvents();
    });
  }, [loadEvents]);

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
    }, [loadEvents]),
  );

  return {
    createdEventIds,
    events,
    isLoading,
    refresh: loadEvents,
  };
}
