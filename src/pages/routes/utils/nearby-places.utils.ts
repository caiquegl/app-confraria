import type { NearbyPlace } from "@/pages/services/types/services.types";

/**
 * Prioridade comercial no carrossel "Por perto":
 * 1. Patrocinado
 * 2. Parceiro Confraria
 * 3. Orgânico (Google)
 * Empate: melhor rating Google.
 */
export function sortNearbyPlacesByPriority(places: NearbyPlace[]): NearbyPlace[] {
  return [...places].sort((left, right) => {
    const leftRank = left.isSponsored ? 0 : left.isConfrariaPartner ? 1 : 2;
    const rightRank = right.isSponsored ? 0 : right.isConfrariaPartner ? 1 : 2;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return (right.googleRating ?? 0) - (left.googleRating ?? 0);
  });
}

export function dedupeNearbyPlaces(places: NearbyPlace[]): NearbyPlace[] {
  const byId = new Map<string, NearbyPlace>();

  for (const place of places) {
    const existing = byId.get(place.googlePlaceId);
    if (!existing) {
      byId.set(place.googlePlaceId, place);
      continue;
    }

    // Mantém o registro com mais selos comerciais / rating.
    const existingRank =
      (existing.isSponsored ? 2 : 0) + (existing.isConfrariaPartner ? 1 : 0);
    const nextRank =
      (place.isSponsored ? 2 : 0) + (place.isConfrariaPartner ? 1 : 0);

    if (
      nextRank > existingRank ||
      (nextRank === existingRank &&
        (place.googleRating ?? 0) > (existing.googleRating ?? 0))
    ) {
      byId.set(place.googlePlaceId, {
        ...existing,
        ...place,
        isConfrariaPartner:
          Boolean(existing.isConfrariaPartner) || Boolean(place.isConfrariaPartner),
        isSponsored: Boolean(existing.isSponsored) || Boolean(place.isSponsored),
      });
    }
  }

  return [...byId.values()];
}
