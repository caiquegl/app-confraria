import { useCallback, useEffect, useState } from "react";

import {
  getStoredGeolocation,
  prefetchGeolocation,
  refreshGeolocation,
  requestGeolocationPermission,
  subscribeGeolocation,
} from "./geolocation-store";

export function useGeolocation() {
  const [location, setLocation] = useState(getStoredGeolocation);

  useEffect(() => subscribeGeolocation(setLocation), []);

  useEffect(() => {
    if (location.status === "ready" && location.cityLabel) {
      return;
    }

    if (location.status === "denied" || location.status === "error") {
      return;
    }

    void prefetchGeolocation();
  }, [location.cityLabel, location.status]);

  const requestPermission = useCallback(async () => {
    await requestGeolocationPermission();
  }, []);

  const refreshLocation = useCallback(async () => {
    await refreshGeolocation();
  }, []);

  return {
    location,
    refreshLocation,
    requestPermission,
  };
}
