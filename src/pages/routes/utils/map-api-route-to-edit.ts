import type { RouteApiResponse } from "../types/saved-route.types";
import type {
  RouteCreateCacheSnapshot,
  RouteCreateTripSchedule,
  RouteDraftDay,
  RoutePlace,
} from "../types/route-create.types";
import { createRouteStop } from "../utils/route-day.utils";

function mapPlace(place: {
  description: string;
  latitude: number;
  longitude: number;
  mainText: string;
  placeId: string;
  secondaryText: string | null;
}): RoutePlace {
  return {
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    mainText: place.mainText,
    placeId: place.placeId,
    secondaryText: place.secondaryText ?? "",
  };
}

function formatTripDateFromIso(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTripTimeFromIso(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
}

export function mapApiRouteToEditSnapshot(route: RouteApiResponse): RouteCreateCacheSnapshot {
  const days: RouteDraftDay[] = route.days.map((day) => {
    const origin = day.places.find((place) => place.role === "origin");
    const destination = day.places.find((place) => place.role === "destination");
    const stops = day.places
      .filter((place) => place.role === "stop")
      .sort((a, b) => a.order - b.order);

    return {
      destination: destination ? mapPlace(destination) : null,
      id: day.id,
      label: day.label,
      origin: origin ? mapPlace(origin) : null,
      stops: stops.map((stop) => ({
        id: stop.id,
        place: mapPlace(stop),
      })),
    };
  });

  const tripSchedule: RouteCreateTripSchedule = {
    tripDate: formatTripDateFromIso(route.startsAt),
    tripIntent: route.status === "scheduled" ? "later" : "now",
    tripNote: route.tripNote ?? "",
    tripTime: formatTripTimeFromIso(route.startsAt),
  };

  return {
    draft: {
      itinerary: {
        activeDayId: days[0]?.id ?? createRouteStop().id,
        days: days.length > 0 ? days : [],
      },
      motorcycle: {
        bikeId: route.userBikeId,
      },
      preferences: {
        avoidTolls: route.avoidTolls,
        optimizeFuel: route.optimizeFuel,
      },
    },
    sheetState: "normal",
    step: 1,
    tripSchedule,
    version: 1,
  };
}
