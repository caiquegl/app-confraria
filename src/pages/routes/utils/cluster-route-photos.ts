import type { RoutePhoto, RoutePhotoCluster } from "../types/route-photo.types";

/** Agrupa fotos próximas (~60 m) em um único pin no mapa. */
const CLUSTER_RADIUS_METERS = 60;

export function clusterRoutePhotos(photos: RoutePhoto[]): RoutePhotoCluster[] {
  const clusters: RoutePhotoCluster[] = [];

  for (const photo of photos) {
    const nearby = clusters.find(
      (cluster) =>
        distanceMeters(
          cluster.latitude,
          cluster.longitude,
          photo.latitude,
          photo.longitude,
        ) <= CLUSTER_RADIUS_METERS,
    );

    if (nearby) {
      nearby.photos.push(photo);
      const count = nearby.photos.length;
      nearby.latitude =
        nearby.photos.reduce((sum, item) => sum + item.latitude, 0) / count;
      nearby.longitude =
        nearby.photos.reduce((sum, item) => sum + item.longitude, 0) / count;
      continue;
    }

    clusters.push({
      id: photo.id,
      latitude: photo.latitude,
      longitude: photo.longitude,
      photos: [photo],
    });
  }

  return clusters;
}

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
