import { useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import { appLog } from "@/lib/app-log";
import { getCurrentUserId } from "@/lib/auth";
import {
  connectRouteNavigationSocket,
  disconnectRouteNavigationSocket,
  emitRouteNavigationLocation,
  joinRouteNavigationRoom,
  subscribeRouteLocationUpdate,
  subscribeRouteLocationsSnapshot,
  subscribeRouteNavigationError,
  subscribeRouteParticipantLeft,
  type RouteLiveLocation,
} from "@/lib/route-navigation-socket";

type UseRouteLiveLocationsParams = {
  currentPosition: { latitude: number; longitude: number } | null;
  enabled: boolean;
  heading: number;
  routeId: string;
};

const STALE_LOG_THROTTLE_MS = 30_000;

function locationTimestampMs(location: RouteLiveLocation): number {
  const parsed = Date.parse(location.updatedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergePartnerLocation(
  current: RouteLiveLocation[],
  incoming: RouteLiveLocation,
): RouteLiveLocation[] {
  const existing = current.find((item) => item.userId === incoming.userId);
  if (existing && locationTimestampMs(incoming) < locationTimestampMs(existing)) {
    return current;
  }

  return [...current.filter((item) => item.userId !== incoming.userId), incoming];
}

export function useRouteLiveLocations({
  currentPosition,
  enabled,
  heading,
  routeId,
}: UseRouteLiveLocationsParams) {
  const [partners, setPartners] = useState<RouteLiveLocation[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);
  const lastAppliedAtByUserRef = useRef<Map<string, number>>(new Map());
  const lastStaleLogAtByUserRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    void getCurrentUserId().then((userId) => {
      currentUserIdRef.current = userId;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !routeId) {
      setPartners([]);
      setConnectionError(null);
      setIsJoined(false);
      lastAppliedAtByUserRef.current.clear();
      lastStaleLogAtByUserRef.current.clear();
      return;
    }

    let isMounted = true;

    const unsubscribeError = subscribeRouteNavigationError((payload) => {
      if (!isMounted) return;
      setConnectionError(payload.message);
      appLog.warn("route.location.socket_error", {
        message: payload.message,
        routeId,
      });
      Toast.show({
        text1: "Navegação em tempo real",
        text2: payload.message,
        type: "error",
      });
    });

    const unsubscribeSnapshot = subscribeRouteLocationsSnapshot((payload) => {
      if (!isMounted || payload.routeId !== routeId) return;

      const nextApplied = new Map<string, number>();
      const filtered = payload.locations.filter((location) => {
        if (location.userId === currentUserIdRef.current) return false;
        nextApplied.set(location.userId, locationTimestampMs(location));
        return true;
      });
      lastAppliedAtByUserRef.current = nextApplied;
      setPartners(filtered);
      appLog.info("route.location.snapshot", {
        partners: filtered.length,
        routeId,
      });
    });

    const unsubscribeUpdate = subscribeRouteLocationUpdate((location) => {
      if (!isMounted || location.userId === currentUserIdRef.current) return;

      const incomingAt = locationTimestampMs(location);
      const lastApplied = lastAppliedAtByUserRef.current.get(location.userId) ?? 0;
      if (incomingAt < lastApplied) {
        const now = Date.now();
        const lastLogAt = lastStaleLogAtByUserRef.current.get(location.userId) ?? 0;
        if (now - lastLogAt >= STALE_LOG_THROTTLE_MS) {
          lastStaleLogAtByUserRef.current.set(location.userId, now);
          appLog.info("route.location.stale_ignored", {
            incomingAt: location.updatedAt,
            lastAppliedAt: new Date(lastApplied).toISOString(),
            routeId,
            userId: location.userId,
          });
        }
        return;
      }

      lastAppliedAtByUserRef.current.set(location.userId, incomingAt);
      setPartners((current) => mergePartnerLocation(current, location));
    });

    const unsubscribeLeft = subscribeRouteParticipantLeft(({ userId }) => {
      if (!isMounted) return;
      lastAppliedAtByUserRef.current.delete(userId);
      setPartners((current) => current.filter((item) => item.userId !== userId));
    });

    void (async () => {
      try {
        const activeSocket = await connectRouteNavigationSocket();
        if (!activeSocket) {
          if (!isMounted) return;
          setIsJoined(false);
          setConnectionError("Não foi possível conectar na navegação em tempo real");
          appLog.warn("route.location.join_fail", {
            message: "socket null",
            routeId,
          });
          return;
        }

        await joinRouteNavigationRoom(routeId);
        if (isMounted) {
          setIsJoined(true);
          setConnectionError(null);
          appLog.info("route.location.join_ok", { routeId });
        }
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível entrar na sala da rota";
        setIsJoined(false);
        setConnectionError(message);
        appLog.warn("route.location.join_fail", {
          message,
          routeId,
        });
        Toast.show({
          text1: "Navegação em tempo real",
          text2: message,
          type: "error",
        });
      }
    })();

    return () => {
      isMounted = false;
      setIsJoined(false);
      unsubscribeError();
      unsubscribeSnapshot();
      unsubscribeUpdate();
      unsubscribeLeft();
      void disconnectRouteNavigationSocket();
    };
  }, [enabled, routeId]);

  useEffect(() => {
    if (!enabled || !routeId || !currentPosition || !isJoined) return;

    void emitRouteNavigationLocation({
      heading,
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
      routeId,
    });
  }, [currentPosition, enabled, heading, isJoined, routeId]);

  return { connectionError, isJoined, partners };
}
