import type { RouteApiResponse } from "../types/saved-route.types";

export type RouteNavigationPlacePin = {
  id: string;
  kind: "destination" | "stop";
  latitude: number;
  longitude: number;
  pinLabel: string;
  title: string;
};

/**
 * Pins de paradas + destino para a navegação.
 * Origem é omitida (ponto de partida); paradas são numeradas na ordem do trajeto.
 */
export function buildNavigationPlacePins(
  route: RouteApiResponse,
): RouteNavigationPlacePin[] {
  const pins: RouteNavigationPlacePin[] = [];
  let stopNumber = 0;

  for (const day of route.days) {
    const places = [...day.places].sort((a, b) => a.order - b.order);

    for (const place of places) {
      if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
        continue;
      }

      if (place.role === "origin") {
        continue;
      }

      // A API de rota não devolve id único por place; montamos chave estável por dia/ordem.
      const pinId = `${day.id}:${place.role}:${place.order}:${place.placeId}`;

      if (place.role === "stop") {
        stopNumber += 1;
        pins.push({
          id: pinId,
          kind: "stop",
          latitude: place.latitude,
          longitude: place.longitude,
          pinLabel: String(stopNumber),
          title: place.mainText || `Parada ${stopNumber}`,
        });
        continue;
      }

      if (place.role === "destination") {
        pins.push({
          id: pinId,
          kind: "destination",
          latitude: place.latitude,
          longitude: place.longitude,
          pinLabel: "●",
          title: place.mainText || "Destino",
        });
      }
    }
  }

  return pins;
}
