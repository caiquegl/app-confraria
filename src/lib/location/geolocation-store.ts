import * as Location from "expo-location";

import { formatReverseGeocodeLabel } from "./format-location-label";
import type { GeolocationState } from "./types";

const INITIAL_STATE: GeolocationState = {
  canAskAgain: true,
  city: null,
  cityLabel: null,
  latitude: null,
  longitude: null,
  region: null,
  status: "idle",
};

let geolocation = INITIAL_STATE;
let resolveInFlight: Promise<void> | null = null;

const listeners = new Set<(state: GeolocationState) => void>();

function notify() {
  listeners.forEach((listener) => listener(geolocation));
}

function patchGeolocation(patch: Partial<GeolocationState>) {
  geolocation = { ...geolocation, ...patch };
  notify();
}

export function getStoredGeolocation(): GeolocationState {
  return geolocation;
}

export function subscribeGeolocation(
  listener: (state: GeolocationState) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function reverseGeocodePosition(
  latitude: number,
  longitude: number,
): Promise<Pick<GeolocationState, "city" | "cityLabel" | "region">> {
  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];

  return {
    city: place?.city?.trim() || place?.subregion?.trim() || place?.district?.trim() || null,
    cityLabel: formatReverseGeocodeLabel(place),
    region: place?.region?.trim() || null,
  };
}

async function applyPosition(
  position: Location.LocationObject,
  canAskAgain: boolean,
) {
  const { latitude, longitude } = position.coords;

  patchGeolocation({
    canAskAgain,
    city: geolocation.city,
    cityLabel: geolocation.cityLabel ?? "Localização atual",
    latitude,
    longitude,
    region: geolocation.region,
    status: "ready",
  });

  try {
    const geocoded = await reverseGeocodePosition(latitude, longitude);
    patchGeolocation({
      ...geocoded,
      canAskAgain,
      latitude,
      longitude,
      status: "ready",
    });
  } catch {
    patchGeolocation({
      canAskAgain,
      city: null,
      cityLabel: "Localização atual",
      latitude,
      longitude,
      region: null,
      status: "ready",
    });
  }
}

async function resolveGeolocation(requestPermission: boolean) {
  if (geolocation.status === "loading" && resolveInFlight) {
    return resolveInFlight;
  }

  resolveInFlight = (async () => {
    patchGeolocation({ status: "loading" });

    try {
      let permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted && requestPermission) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (!permission.granted) {
        geolocation = {
          canAskAgain: permission.canAskAgain,
          city: null,
          cityLabel: null,
          latitude: null,
          longitude: null,
          region: null,
          status: "denied",
        };
        notify();
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        geolocation = {
          canAskAgain: permission.canAskAgain,
          city: null,
          cityLabel: null,
          latitude: null,
          longitude: null,
          region: null,
          status: "error",
        };
        notify();
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        await applyPosition(lastKnown, permission.canAskAgain);
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await applyPosition(position, permission.canAskAgain);
    } catch {
      geolocation = {
        canAskAgain: geolocation.canAskAgain,
        city: null,
        cityLabel: null,
        latitude: null,
        longitude: null,
        region: null,
        status: "error",
      };
      notify();
    }
  })().finally(() => {
    resolveInFlight = null;
  });

  return resolveInFlight;
}

export function prefetchGeolocation(options?: { requestPermission?: boolean }) {
  if (geolocation.status === "ready" && geolocation.cityLabel) {
    return Promise.resolve();
  }

  return resolveGeolocation(options?.requestPermission ?? false);
}

export function requestGeolocationPermission() {
  return resolveGeolocation(true);
}

export function refreshGeolocation() {
  return resolveGeolocation(false);
}
