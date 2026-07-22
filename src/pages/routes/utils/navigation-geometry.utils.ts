type Coordinate = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineDistanceMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function bearingBetween(a: Coordinate, b: Coordinate): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const toDeg = (value: number) => (value * 180) / Math.PI;

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function findClosestPointOnPolyline(
  point: Coordinate,
  polyline: Coordinate[],
): { distanceMeters: number; index: number; point: Coordinate } {
  if (polyline.length === 0) {
    return { distanceMeters: Number.POSITIVE_INFINITY, index: 0, point };
  }

  if (polyline.length === 1) {
    return {
      distanceMeters: haversineDistanceMeters(point, polyline[0]),
      index: 0,
      point: polyline[0],
    };
  }

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  let closestPoint = polyline[0];

  for (let index = 0; index < polyline.length - 1; index += 1) {
    const start = polyline[index];
    const end = polyline[index + 1];
    const projected = projectPointOnSegment(point, start, end);
    const distance = haversineDistanceMeters(point, projected);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
      closestPoint = projected;
    }
  }

  return {
    distanceMeters: closestDistance,
    index: closestIndex,
    point: closestPoint,
  };
}

function projectPointOnSegment(
  point: Coordinate,
  start: Coordinate,
  end: Coordinate,
): Coordinate {
  const dx = end.longitude - start.longitude;
  const dy = end.latitude - start.latitude;

  if (dx === 0 && dy === 0) {
    return start;
  }

  const t =
    ((point.longitude - start.longitude) * dx + (point.latitude - start.latitude) * dy) /
    (dx * dx + dy * dy);

  const clamped = Math.max(0, Math.min(1, t));

  return {
    latitude: start.latitude + clamped * dy,
    longitude: start.longitude + clamped * dx,
  };
}

export function sumPolylineDistanceMeters(
  polyline: Coordinate[],
  startIndex = 0,
): number {
  let total = 0;

  for (let index = Math.max(0, startIndex); index < polyline.length - 1; index += 1) {
    total += haversineDistanceMeters(polyline[index], polyline[index + 1]);
  }

  return total;
}

export function formatNavigationDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatEtaFromSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const date = new Date(Date.now() + safeSeconds * 1000);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
}

export function formatDurationFromSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}
