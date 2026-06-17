import type { LocationGeocodedAddress } from "expo-location";

export function formatReverseGeocodeLabel(
  place: LocationGeocodedAddress | undefined,
): string {
  if (!place) return "Localização atual";

  const city = place.city?.trim() || place.subregion?.trim() || place.district?.trim();
  const region = place.region?.trim();

  if (city && region) {
    return `${city}, ${region}`;
  }

  if (city) return city;
  if (region) return region;

  return place.name?.trim() || "Localização atual";
}
