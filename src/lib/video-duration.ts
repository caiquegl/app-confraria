/** Limite alinhado ao backend (`MAX_VIDEO_DURATION_MS`). */
export const MAX_FEED_VIDEO_DURATION_MS = 30_000;

/**
 * Normaliza duração de vídeo para milissegundos.
 * ImagePicker costuma devolver segundos; timers de câmera já vêm em ms.
 * Heurística: valores ≤ 180 tratados como segundos (até 3 min).
 */
export function normalizeVideoDurationMs(
  raw: number | null | undefined,
): number | null {
  if (raw == null || !Number.isFinite(raw) || raw <= 0) return null;
  if (raw <= 180) return Math.round(raw * 1000);
  return Math.round(raw);
}

export function formatRecordingTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getFeedVideoDurationError(
  durationMs: number | null | undefined,
): string | null {
  if (!durationMs) {
    return "Não foi possível obter a duração do vídeo. Tente outro arquivo.";
  }
  if (durationMs > MAX_FEED_VIDEO_DURATION_MS) {
    return "Escolha vídeos de até 30 segundos.";
  }
  return null;
}
