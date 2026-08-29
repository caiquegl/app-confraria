import type { RouteCreatePayload } from "../types/route-create.types";
import type { CreateRoutePayload, RouteCreateAction } from "../types/saved-route.types";

type DaySummary = {
  dayId: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
};

type BuildCreateRoutePayloadParams = {
  action: RouteCreateAction;
  coverImageUri?: string | null;
  daySummaries: DaySummary[];
  draftPayload: RouteCreatePayload;
  kind?: CreateRoutePayload["kind"];
  schedule: {
    tripDate: string;
    tripNote: string;
    tripTime: string;
  };
  thumbnailType?: CreateRoutePayload["thumbnailType"];
  totals: {
    fuelCost: number | null;
    tollCost: number | null;
    totalDistanceMeters: number | null;
    totalDurationSeconds: number | null;
  };
};

export function buildCreateRoutePayload({
  action,
  coverImageUri,
  daySummaries,
  draftPayload,
  kind,
  schedule,
  thumbnailType,
  totals,
}: BuildCreateRoutePayloadParams): CreateRoutePayload {
  return {
    action,
    days: draftPayload.days.map((day, index) => {
      const summary = daySummaries[index];

      return {
        destination: day.destination,
        ...(summary?.distanceMeters != null
          ? { distanceMeters: summary.distanceMeters }
          : {}),
        ...(summary?.durationSeconds != null
          ? { durationSeconds: summary.durationSeconds }
          : {}),
        label: day.label,
        origin: day.origin,
        overnight: day.overnight,
        stops: day.stops,
      };
    }),
    motorcycle: {
      bikeId: draftPayload.motorcycle.bikeId as string,
    },
    ...(kind ? { kind } : {}),
    preferences: draftPayload.preferences,
    thumbnailType: thumbnailType ?? "map",
    ...(thumbnailType === "image" && coverImageUri ? { coverImageUri } : {}),
    schedule: {
      tripDate: schedule.tripDate.trim() || undefined,
      tripNote: schedule.tripNote.trim() || undefined,
      tripTime: schedule.tripTime.trim() || undefined,
    },
    totals: {
      ...(totals.totalDistanceMeters != null
        ? { distanceMeters: totals.totalDistanceMeters }
        : {}),
      ...(totals.totalDurationSeconds != null
        ? { durationSeconds: totals.totalDurationSeconds }
        : {}),
      ...(totals.fuelCost != null ? { fuelCost: totals.fuelCost } : {}),
      ...(totals.tollCost != null ? { tollCost: totals.tollCost } : {}),
    },
  };
}
