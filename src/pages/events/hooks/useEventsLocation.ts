import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";

import type { EventsLocationState } from "../types/events.types";
import { formatReverseGeocodeLabel } from "../utils/format-location-label";

const INITIAL_STATE: EventsLocationState = {
  canAskAgain: true,
  cityLabel: null,
  latitude: null,
  longitude: null,
  status: "idle",
};

export function useEventsLocation() {
  const [location, setLocation] = useState<EventsLocationState>(INITIAL_STATE);
  const shouldRequestPermissionRef = useRef(true);

  const resolveLocation = useCallback(async (requestPermission: boolean) => {
    setLocation((current) => ({
      ...current,
      status: "loading",
    }));

    try {
      let permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted && requestPermission) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (!permission.granted) {
        setLocation({
          canAskAgain: permission.canAskAgain,
          cityLabel: null,
          latitude: null,
          longitude: null,
          status: "denied",
        });
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocation({
          canAskAgain: permission.canAskAgain,
          cityLabel: null,
          latitude: null,
          longitude: null,
          status: "error",
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const places = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      setLocation({
        canAskAgain: permission.canAskAgain,
        cityLabel: formatReverseGeocodeLabel(places[0]),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        status: "ready",
      });
    } catch {
      setLocation((current) => ({
        canAskAgain: current.canAskAgain,
        cityLabel: null,
        latitude: null,
        longitude: null,
        status: "error",
      }));
    }
  }, []);

  const requestPermission = useCallback(async () => {
    shouldRequestPermissionRef.current = true;
    await resolveLocation(true);
    shouldRequestPermissionRef.current = false;
  }, [resolveLocation]);

  useFocusEffect(
    useCallback(() => {
      void resolveLocation(shouldRequestPermissionRef.current);
      shouldRequestPermissionRef.current = false;
    }, [resolveLocation]),
  );

  return {
    location,
    requestPermission,
    refreshLocation: () => resolveLocation(false),
  };
}
