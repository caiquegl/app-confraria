import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchServices,
  toggleServiceFavorite,
} from "../services/services.service";
import type { Service, ServicesSection } from "../types/services.types";

const QUICK_CATEGORY = "Mecânicas";

const SECTION_ORDER = [
  "Hotéis",
  "Acessórios",
  "Moto escolas",
  "Guinchos",
  "Mecânicas",
];

function orderCategories(categories: string[]): string[] {
  const known = SECTION_ORDER.filter((category) =>
    categories.includes(category),
  );
  const rest = categories
    .filter((category) => !SECTION_ORDER.includes(category))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: { refreshing?: boolean }) => {
    if (options?.refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchServices();
      setServices(data);
    } catch {
      setError("Não foi possível carregar os serviços.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load({ refreshing: true }), [load]);

  const toggleFavorite = useCallback(async (service: Service) => {
    const previous = Boolean(service.isFavorited);

    setServices((current) =>
      current.map((item) =>
        item.id === service.id ? { ...item, isFavorited: !previous } : item,
      ),
    );

    try {
      const result = await toggleServiceFavorite(service.id, previous);
      setServices((current) =>
        current.map((item) =>
          item.id === service.id
            ? { ...item, isFavorited: result.isFavorited }
            : item,
        ),
      );
    } catch {
      setServices((current) =>
        current.map((item) =>
          item.id === service.id ? { ...item, isFavorited: previous } : item,
        ),
      );
    }
  }, []);

  const quickServices = useMemo(
    () => services.filter((service) => service.category === QUICK_CATEGORY),
    [services],
  );

  const sections = useMemo<ServicesSection[]>(() => {
    const categories = orderCategories(
      Array.from(new Set(services.map((service) => service.category))),
    );

    return categories.map((category) => ({
      category,
      services: services.filter((service) => service.category === category),
    }));
  }, [services]);

  return {
    error,
    isLoading,
    isRefreshing,
    quickServices,
    refresh,
    sections,
    services,
    toggleFavorite,
  };
}
