import type { RoutePathOption } from "../hooks/useRouteDirections";
import type { CreateRoutePayload, RouteCreateAction, RouteKind } from "../types/saved-route.types";
import type { QuickRoutePlace } from "../types/quick-route.types";

function toPayloadPlace(place: QuickRoutePlace) {
  return {
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    mainText: place.mainText || place.description,
    placeId: place.placeId,
    secondaryText: place.secondaryText ?? "",
  };
}

type BuildQuickRoutePayloadParams = {
  action: RouteCreateAction | "save_draft";
  avoidTolls?: boolean;
  bikeId: string;
  coverImageUri?: string | null;
  destination: QuickRoutePlace;
  fuelCost?: number | null;
  kind: RouteKind;
  origin: QuickRoutePlace;
  selectedOption: RoutePathOption | null;
  stops: QuickRoutePlace[];
  thumbnailType?: CreateRoutePayload["thumbnailType"];
  tripNote?: string;
};

export function buildQuickRoutePayload({
  action,
  avoidTolls = false,
  bikeId,
  coverImageUri,
  destination,
  fuelCost,
  kind,
  origin,
  selectedOption,
  stops,
  thumbnailType,
  tripNote,
}: BuildQuickRoutePayloadParams): CreateRoutePayload {
  return {
    action: action === "save_draft" ? "save_draft" : action,
    days: [
      {
        destination: toPayloadPlace(destination),
        distanceMeters: selectedOption?.distanceMeters ?? undefined,
        durationSeconds: selectedOption?.durationSeconds ?? undefined,
        label: "Rota rápida",
        origin: toPayloadPlace(origin),
        overnight: false,
        stops: stops.map(toPayloadPlace),
      },
    ],
    kind,
    motorcycle: { bikeId },
    preferences: {
      avoidTolls,
      optimizeFuel: true,
    },
    thumbnailType: thumbnailType ?? "map",
    ...(thumbnailType === "image" && coverImageUri ? { coverImageUri } : {}),
    schedule: {
      tripNote: tripNote?.trim() || undefined,
    },
    totals: {
      distanceMeters: selectedOption?.distanceMeters ?? undefined,
      durationSeconds: selectedOption?.durationSeconds ?? undefined,
      fuelCost: fuelCost ?? undefined,
      tollCost: selectedOption?.tollCost ?? undefined,
    },
  };
}
