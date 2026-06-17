import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import type { EventsLocationState } from "../types/events.types";
import { formatReverseGeocodeLabel } from "../utils/format-location-label";

const INITIAL_STATE: EventsLocationState = {
  canAskAgain: true,
  city: null,
  cityLabel: null,
  latitude: null,
  longitude: null,
  region: null,
  status: "idle",
};

export function useEventsLocation() {
  const [location, setLocation] = useState<EventsLocationState>(INITIAL_STATE);
  const shouldRequestPermissionRef = useRef(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resolveLocation = useCallback(async (requestPermission: boolean) => {
    if (!isMountedRef.current) return;

    setLocation((current) => ({
      ...current,
      status: "loading",
    }));

    try {
      let permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted && requestPermission) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (!isMountedRef.current) return;

      if (!permission.granted) {
        setLocation({
          canAskAgain: permission.canAskAgain,
          city: null,
          cityLabel: null,
          latitude: null,
          longitude: null,
          region: null,
          status: "denied",
        });
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!isMountedRef.current) return;

      if (!servicesEnabled) {
        setLocation({
          canAskAgain: permission.canAskAgain,
          city: null,
          cityLabel: null,
          latitude: null,
          longitude: null,
          region: null,
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

      if (!isMountedRef.current) return;

      const place = places[0];

      setLocation({
        canAskAgain: permission.canAskAgain,
        city: place?.city?.trim() || place?.subregion?.trim() || place?.district?.trim() || null,
        cityLabel: formatReverseGeocodeLabel(place),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        region: place?.region?.trim() || null,
        status: "ready",
      });
    } catch {
      if (!isMountedRef.current) return;

      setLocation((current) => ({
        canAskAgain: current.canAskAgain,
        city: null,
        cityLabel: null,
        latitude: null,
        longitude: null,
        region: null,
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
