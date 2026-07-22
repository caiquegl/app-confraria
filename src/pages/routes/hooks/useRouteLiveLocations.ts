import { useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

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
      return;
    }

    let isMounted = true;

    const unsubscribeError = subscribeRouteNavigationError((payload) => {
      if (!isMounted) return;
      setConnectionError(payload.message);
      Toast.show({
        text1: "Navegação em tempo real",
        text2: payload.message,
        type: "error",
      });
    });

    const unsubscribeSnapshot = subscribeRouteLocationsSnapshot((payload) => {
      if (!isMounted || payload.routeId !== routeId) return;

      setPartners(
        payload.locations.filter((location) => location.userId !== currentUserIdRef.current),
      );
    });

    const unsubscribeUpdate = subscribeRouteLocationUpdate((location) => {
      if (!isMounted || location.userId === currentUserIdRef.current) return;

      setPartners((current) => {
        const next = current.filter((item) => item.userId !== location.userId);
        return [...next, location];
      });
    });

    const unsubscribeLeft = subscribeRouteParticipantLeft(({ userId }) => {
      if (!isMounted) return;
      setPartners((current) => current.filter((item) => item.userId !== userId));
    });

    void (async () => {
      try {
        await connectRouteNavigationSocket();
        await joinRouteNavigationRoom(routeId);
        if (isMounted) {
          setIsJoined(true);
          setConnectionError(null);
        }
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível entrar na sala da rota";
        setConnectionError(message);
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

  return { connectionError, partners };
}
