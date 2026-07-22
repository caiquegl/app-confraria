import type { PlaceReference } from "@/lib/places";

import type {
  RouteCreateDayPayload,
  RouteCreateDraft,
  RouteCreatePayload,
  RouteCreatePlacePayload,
  RouteDraftDay,
  RoutePlace,
} from "../types/route-create.types";
import type { MapMarkerPoint } from "../types/route-create.types";
import { createRouteDayDraft, getDayColor } from "./route-day.utils";

export function labelOnlyPlace(
  label: string,
  coords?: { latitude: number; longitude: number },
): RoutePlace {
  return {
    description: label,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    mainText: label,
  };
}

export function placeFromReference(
  place: PlaceReference,
  coords?: { latitude: number; longitude: number },
): RoutePlace {
  return {
    description: place.description,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    mainText: place.mainText,
    placeId: place.placeId,
    secondaryText: place.secondaryText,
  };
}

export function getDayOrigin(days: RouteDraftDay[], dayIndex: number): RoutePlace | null {
  if (dayIndex <= 0) {
    return days[0]?.origin ?? null;
  }

  return days[dayIndex - 1]?.destination ?? null;
}

export function getDayOriginLabel(days: RouteDraftDay[], dayIndex: number): string {
  const origin = getDayOrigin(days, dayIndex);
  return origin?.mainText?.trim() || origin?.description?.trim() || "Defina o destino do dia anterior";
}

export function createInitialRouteCreateDraft(
  initialOriginLabel?: string | null,
  initialOriginCoords?: { latitude: number; longitude: number } | null,
): RouteCreateDraft {
  const firstDay = createRouteDayDraft(0);

  if (initialOriginLabel) {
    firstDay.origin = labelOnlyPlace(initialOriginLabel, initialOriginCoords ?? undefined);
  }

  return {
    itinerary: {
      activeDayId: firstDay.id,
      days: [firstDay],
    },
    motorcycle: {
      bikeId: null,
    },
    preferences: {
      avoidTolls: false,
      optimizeFuel: true,
    },
  };
}

function hasPlaceLabel(place: RoutePlace | null | undefined): boolean {
  return Boolean(place?.description?.trim() || place?.mainText?.trim());
}

function toPlacePayload(place: RoutePlace | null | undefined): RouteCreatePlacePayload | null {
  if (!place || !hasPlaceLabel(place)) {
    return null;
  }

  if (place.latitude == null || place.longitude == null) {
    return null;
  }

  return {
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    mainText: place.mainText ?? place.description,
    placeId: place.placeId ?? place.description,
    secondaryText: place.secondaryText ?? "",
  };
}

export function canCompleteStep2(draft: RouteCreateDraft): boolean {
  return Boolean(draft.motorcycle.bikeId);
}

export function canCompleteStep3(_draft: RouteCreateDraft): boolean {
  return true;
}

export function canCompleteStep4(_draft: RouteCreateDraft): boolean {
  return true;
}

export function buildRouteCreatePayload(draft: RouteCreateDraft): RouteCreatePayload | null {
  if (!canCompleteStep2(draft)) {
    return null;
  }

  const dayPayloads: RouteCreateDayPayload[] = [];

  for (let index = 0; index < draft.itinerary.days.length; index += 1) {
    const day = draft.itinerary.days[index];
    const origin = toPlacePayload(getDayOrigin(draft.itinerary.days, index));
    const destination = toPlacePayload(day.destination);

    if (!origin || !destination) {
      return null;
    }

    const stops = day.stops
      .map((stop) => toPlacePayload(stop.place))
      .filter((stop): stop is RouteCreatePlacePayload => stop != null);

    dayPayloads.push({
      destination,
      label: day.label,
      origin,
      overnight: day.overnight ?? false,
      stops,
    });
  }

  return {
    days: dayPayloads,
    motorcycle: draft.motorcycle,
    preferences: draft.preferences,
  };
}

export function canCompleteStep1(draft: RouteCreateDraft): boolean {
  const { days } = draft.itinerary;

  if (!hasPlaceLabel(days[0]?.origin)) {
    return false;
  }

  return days.every((day) => hasPlaceLabel(day.destination));
}

export function buildMapMarkersFromDraft(days: RouteDraftDay[]): MapMarkerPoint[] {
  const markers: MapMarkerPoint[] = [];

  days.forEach((day, dayIndex) => {
    const accentColor = getDayColor(dayIndex);
    const origin = getDayOrigin(days, dayIndex);
    const hasNextDay = dayIndex < days.length - 1;

    if (dayIndex === 0 && origin?.latitude != null && origin.longitude != null) {
      markers.push({
        accentColor,
        coordinate: { latitude: origin.latitude, longitude: origin.longitude },
        dayIndex,
        dayLabel: day.label,
        id: `${day.id}-start`,
        kind: "day-start",
        pinLabel: `${dayIndex + 1}`,
        subtitle: "Ponto de partida",
        title: `Início ${day.label}`,
      });
    }

    day.stops.forEach((stop, stopIndex) => {
      if (stop.place?.latitude == null || stop.place.longitude == null) {
        return;
      }

      markers.push({
        accentColor,
        coordinate: {
          latitude: stop.place.latitude,
          longitude: stop.place.longitude,
        },
        dayIndex,
        dayLabel: day.label,
        id: `${day.id}-${stop.id}`,
        kind: "stop",
        pinLabel: `${stopIndex + 1}`,
        subtitle: day.label,
        title: stop.place.description || `Parada ${stopIndex + 1}`,
      });
    });

    if (day.destination?.latitude == null || day.destination.longitude == null) {
      return;
    }

    const destinationCoordinate = {
      latitude: day.destination.latitude,
      longitude: day.destination.longitude,
    };

    if (hasNextDay) {
      const nextDay = days[dayIndex + 1];
      markers.push({
        accentColor,
        coordinate: destinationCoordinate,
        dayIndex,
        dayLabel: day.label,
        id: `${day.id}-transition`,
        kind: "day-transition",
        pinLabel: `${dayIndex + 1}→${dayIndex + 2}`,
        subtitle: `Início ${nextDay.label}`,
        title: `Fim ${day.label}`,
      });
      return;
    }

    markers.push({
      accentColor: getDayColor(dayIndex),
      coordinate: destinationCoordinate,
      dayIndex,
      dayLabel: day.label,
      id: `${day.id}-destination`,
      kind: "day-destination",
      pinLabel: "●",
      subtitle: "Destino final",
      title: `Destino ${day.label}`,
    });
  });

  return markers;
}

export function buildDayWaypoints(
  days: RouteDraftDay[],
  dayIndex: number,
): Array<{ latitude: number; longitude: number }> {
  const day = days[dayIndex];
  if (!day) return [];

  const origin = getDayOrigin(days, dayIndex);
  if (origin?.latitude == null || origin.longitude == null) {
    return [];
  }

  const points = [
    { latitude: origin.latitude, longitude: origin.longitude },
    ...day.stops.flatMap((stop) => {
      if (stop.place?.latitude == null || stop.place.longitude == null) {
        return [];
      }

      return [{ latitude: stop.place.latitude, longitude: stop.place.longitude }];
    }),
  ];

  if (day.destination?.latitude == null || day.destination.longitude == null) {
    return points.length >= 2 ? points : [];
  }

  const destinationPoint = {
    latitude: day.destination.latitude,
    longitude: day.destination.longitude,
  };
  const lastPoint = points[points.length - 1];

  if (
    lastPoint?.latitude !== destinationPoint.latitude ||
    lastPoint.longitude !== destinationPoint.longitude
  ) {
    points.push(destinationPoint);
  }

  return points.length >= 2 ? points : [];
}

export function buildRouteWaypointsFromDraft(days: RouteDraftDay[]): Array<{
  latitude: number;
  longitude: number;
}> {
  const points: Array<{ latitude: number; longitude: number }> = [];

  days.forEach((day, dayIndex) => {
    const origin = getDayOrigin(days, dayIndex);

    if (points.length === 0) {
      if (origin?.latitude == null || origin.longitude == null) {
        return;
      }

      points.push({ latitude: origin.latitude, longitude: origin.longitude });
    }

    day.stops.forEach((stop) => {
      if (stop.place?.latitude == null || stop.place.longitude == null) {
        return;
      }

      points.push({ latitude: stop.place.latitude, longitude: stop.place.longitude });
    });

    if (day.destination?.latitude == null || day.destination.longitude == null) {
      return;
    }

    const lastPoint = points[points.length - 1];
    const destinationPoint = {
      latitude: day.destination.latitude,
      longitude: day.destination.longitude,
    };

    if (
      lastPoint?.latitude === destinationPoint.latitude &&
      lastPoint.longitude === destinationPoint.longitude
    ) {
      return;
    }

    points.push(destinationPoint);
  });

  return points.length >= 2 ? points : [];
}
