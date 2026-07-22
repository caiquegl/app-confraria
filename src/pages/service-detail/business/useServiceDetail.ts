import { useCallback, useEffect, useState } from "react";

import {
  deleteServiceReview,
  fetchServiceDetail,
  fetchServiceReviews,
  toggleServiceFavorite,
  upsertServiceReview,
} from "@/pages/services/services/services.service";
import { fetchPlaceLiveInfo } from "@/pages/services/services/nearby.service";
import type {
  PlaceLiveInfo,
  Service,
  ServiceReview,
  UpsertReviewPayload,
} from "@/pages/services/types/services.types";

export function useServiceDetail(serviceId: string) {
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [liveInfo, setLiveInfo] = useState<PlaceLiveInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLiveInfo(null);

    try {
      const [detail, reviewList] = await Promise.all([
        fetchServiceDetail(serviceId),
        fetchServiceReviews(serviceId),
      ]);
      setService(detail);
      setReviews(reviewList);

      if (detail.googlePlaceId) {
        // Info ao vivo do Google (aberto/fechado, horários) — best-effort.
        fetchPlaceLiveInfo(detail.googlePlaceId)
          .then(setLiveInfo)
          .catch(() => setLiveInfo(null));
      }
    } catch {
      setError("Não foi possível carregar o serviço.");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const myReview = reviews.find((review) => review.isMine) ?? null;

  const toggleFavorite = useCallback(async () => {
    if (!service) return;
    const previous = Boolean(service.isFavorited);
    setService({ ...service, isFavorited: !previous });

    try {
      const result = await toggleServiceFavorite(service.id, previous);
      setService((current) =>
        current ? { ...current, isFavorited: result.isFavorited } : current,
      );
    } catch {
      setService((current) =>
        current ? { ...current, isFavorited: previous } : current,
      );
    }
  }, [service]);

  const submitReview = useCallback(
    async (payload: UpsertReviewPayload) => {
      if (!service) return false;
      setIsSubmitting(true);
      try {
        const result = await upsertServiceReview(service.id, payload);
        setService((current) =>
          current
            ? {
                ...current,
                rating: result.service.rating,
                reviewCount: result.service.reviewCount,
              }
            : result.service,
        );
        setReviews((current) => {
          const rest = current.filter((review) => !review.isMine);
          return [result.review, ...rest];
        });
        return true;
      } catch {
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [service],
  );

  const removeReview = useCallback(async () => {
    if (!service) return false;
    setIsSubmitting(true);
    try {
      const result = await deleteServiceReview(service.id);
      setService((current) =>
        current
          ? {
              ...current,
              rating: result.service.rating,
              reviewCount: result.service.reviewCount,
            }
          : result.service,
      );
      setReviews((current) => current.filter((review) => !review.isMine));
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [service]);

  return {
    error,
    isLoading,
    isSubmitting,
    liveInfo,
    myReview,
    reload: load,
    removeReview,
    reviews,
    service,
    submitReview,
    toggleFavorite,
  };
}
