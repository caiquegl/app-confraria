export function formatRouteDistance(distanceMeters: number | null): string {
  if (distanceMeters == null) return "—";
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(durationSeconds: number | null): string {
  if (durationSeconds == null) return "—";
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
}

export function getPlaceLabel(
  place: { description?: string; mainText?: string } | null | undefined,
): string {
  return place?.mainText?.trim() || place?.description?.trim() || "";
}
