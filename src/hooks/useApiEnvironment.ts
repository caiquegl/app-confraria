import { useCallback, useEffect, useState } from "react";

import {
  API_ENVIRONMENTS,
  type ApiEnvironment,
  getApiEnvironment,
  subscribeApiEnvironment,
  toggleApiEnvironment,
} from "@/lib/api-environment";

export function useApiEnvironment() {
  const [environment, setEnvironment] = useState<ApiEnvironment>("production");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let alive = true;

    getApiEnvironment()
      .then((current) => {
        if (!alive) return;
        setEnvironment(current);
        setIsReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setIsReady(true);
      });

    const unsubscribe = subscribeApiEnvironment((next) => {
      setEnvironment(next);
      setIsReady(true);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const toggleEnvironment = useCallback(async () => {
    const next = await toggleApiEnvironment();
    setEnvironment(next);
    return next;
  }, []);

  return {
    apiUrl: API_ENVIRONMENTS[environment].url,
    environment,
    isHomolog: environment === "homolog",
    isReady,
    label: API_ENVIRONMENTS[environment].label,
    toggleEnvironment,
  };
}
