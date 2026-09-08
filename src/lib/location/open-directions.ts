import { Linking, Platform } from "react-native";

export type DirectionsTarget = {
  label?: string | null;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
};

/**
 * Coordenadas válidas: números finitos dentro dos limites geográficos e
 * diferentes de (0, 0) — valor usado por registros sem localização real.
 */
export function hasValidCoordinates(target: DirectionsTarget | null | undefined): boolean {
  if (!target) return false;
  const { latitude, longitude } = target;
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  if (latitude === 0 && longitude === 0) return false;
  return true;
}

/**
 * Deep link do app de mapas nativo. No Android o esquema `geo:` faz o próprio
 * sistema oferecer os apps compatíveis instalados.
 */
export function buildNativeDirectionsUrl(target: DirectionsTarget): string {
  const latitude = target.latitude as number;
  const longitude = target.longitude as number;
  const label = target.label?.trim() ?? "";

  if (Platform.OS === "ios") {
    const query = label ? `&q=${encodeURIComponent(label)}` : "";
    return `maps://?daddr=${latitude},${longitude}${query}`;
  }

  const marker = label ? `(${label})` : "";
  return `geo:${latitude},${longitude}?q=${latitude},${longitude}${encodeURIComponent(marker)}`;
}

/** Fallback universal via navegador quando nenhum app nativo responde. */
export function buildWebDirectionsUrl(target: DirectionsTarget): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`;
}

/**
 * Abre a navegação até o destino. Retorna false quando as coordenadas são
 * inválidas ou nenhum aplicativo consegue atender ao link.
 */
export async function openDirections(target: DirectionsTarget | null | undefined): Promise<boolean> {
  if (!hasValidCoordinates(target)) return false;

  const validTarget = target as DirectionsTarget;
  const candidates = [buildNativeDirectionsUrl(validTarget), buildWebDirectionsUrl(validTarget)];

  for (const url of candidates) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // Tenta o próximo candidato.
    }
  }

  return false;
}
