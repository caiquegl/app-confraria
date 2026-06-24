import type { PlaceReference } from "@/lib/places";

import type { RoutePlace } from "../types/route-create.types";

export function toPlaceReference(place: RoutePlace | null): PlaceReference | null {
  if (!place) return null;

  return {
    description: place.description,
    mainText: place.mainText ?? place.description,
    placeId: place.placeId ?? place.description,
    reference: place.placeId ?? place.description,
    secondaryText: place.secondaryText ?? "",
    types: [],
  };
}
