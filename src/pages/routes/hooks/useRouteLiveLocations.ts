import { useEffect, useRef, useState } from "react";

import { getCurrentUserId } from "@/lib/auth";
import {
  connectRouteNavigationSocket,
  disconnectRouteNavigationSocket,
  emitRouteNavigationLocation,
  joinRouteNavigationRoom,
  subscribeRouteLocationUpdate,
  subscribeRouteLocationsSnapshot,
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
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    void getCurrentUserId().then((userId) => {
      currentUserIdRef.current = userId;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !routeId) {
      setPartners([]);
      return;
    }

    let isMounted = true;

    void (async () => {
      await connectRouteNavigationSocket();
      joinRouteNavigationRoom(routeId);
    })();

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

    return () => {
      isMounted = false;
      unsubscribeSnapshot();
      unsubscribeUpdate();
      unsubscribeLeft();
      void disconnectRouteNavigationSocket();
    };
  }, [enabled, routeId]);

  useEffect(() => {
    if (!enabled || !routeId || !currentPosition) return;

    emitRouteNavigationLocation({
      heading,
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
      routeId,
    });
  }, [currentPosition, enabled, heading, routeId]);

  return { partners };
}
