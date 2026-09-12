/**
 * Câmera de navegação estilo Google Maps: heading suavizado, zoom por tempo de
 * estrada visível à frente e inclinação proporcional à velocidade.
 */

/** Acima disso o rumo do GPS é confiável; abaixo, vale a bússola. */
const MOVING_ENTER_MPS = 2;
/** Histerese: só volta a "parado" bem abaixo do limiar de entrada. */
const MOVING_EXIT_MPS = 1;

const HEADING_DEADBAND_DEGREES = 2.5;
const MAX_HEADING_RATE_DEG_PER_SECOND = 90;
const HEADING_TAU_MOVING_MS = 350;
/** A bússola é bem mais ruidosa parada, então filtra mais forte. */
const HEADING_TAU_STOPPED_MS = 900;

const LOOK_AHEAD_SECONDS = 25;
const MIN_LOOK_AHEAD_METERS = 120;
/** Fração da altura do mapa reservada para o caminho à frente. */
const LOOK_AHEAD_VIEWPORT_RATIO = 0.75;
const METERS_PER_PIXEL_AT_ZOOM_0 = 156_543.033_92;

const MIN_NAVIGATION_ZOOM = 14;
const MAX_NAVIGATION_ZOOM = 18.5;
export const DEFAULT_NAVIGATION_ZOOM = 17.5;

const MIN_NAVIGATION_PITCH = 30;
const MAX_NAVIGATION_PITCH = 60;
/** Acima de 100 km/h a inclinação satura. */
const PITCH_MAX_SPEED_MPS = 27.8;
export const DEFAULT_NAVIGATION_PITCH = MIN_NAVIGATION_PITCH;

/** Um comando de câmera por segundo, alinhado à cadência do GPS. */
export const CAMERA_TICK_MS = 1000;
/** Levemente maior que o tick para as animações se encadearem sem corte. */
export const CAMERA_ANIMATION_MS = 1150;
/** Mudança de zoom é lenta de propósito: transição brusca parece nervosa. */
export const CAMERA_ZOOM_ANIMATION_MS = 2000;
export const ZOOM_CHANGE_THRESHOLD = 0.25;
export const PITCH_CHANGE_THRESHOLD = 2;

/** Posição do usuário na altura da tela durante a navegação. */
const USER_SCREEN_RATIO = 0.775;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Menor diferença assinada entre dois ângulos, em (-180, 180]. */
export function shortestAngleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

export function resolveIsMoving(speedMps: number, wasMoving: boolean): boolean {
  if (!Number.isFinite(speedMps)) return wasMoving;
  return wasMoving ? speedMps >= MOVING_EXIT_MPS : speedMps > MOVING_ENTER_MPS;
}

export function headingTauForMovement(isMoving: boolean): number {
  return isMoving ? HEADING_TAU_MOVING_MS : HEADING_TAU_STOPPED_MS;
}

export type HeadingSmoother = {
  push: (rawDegrees: number, options?: { tauMs?: number; timestampMs?: number }) => number;
  reset: () => void;
  value: () => number;
};

/**
 * Média exponencial sobre seno/cosseno: trata o salto 359° -> 1° sem caso
 * especial. O alpha é normalizado pelo intervalo real entre amostras porque
 * GPS e bússola não têm cadência fixa.
 */
export function createHeadingSmoother(): HeadingSmoother {
  let sin: number | null = null;
  let cos: number | null = null;
  let lastTimestampMs: number | null = null;
  let smoothed = 0;

  return {
    push(rawDegrees, options = {}) {
      if (!Number.isFinite(rawDegrees)) return smoothed;

      const timestampMs = options.timestampMs ?? Date.now();
      const tauMs = options.tauMs ?? HEADING_TAU_MOVING_MS;
      const raw = normalizeAngle(rawDegrees);
      const radians = (raw * Math.PI) / 180;

      if (sin == null || cos == null || lastTimestampMs == null) {
        sin = Math.sin(radians);
        cos = Math.cos(radians);
        lastTimestampMs = timestampMs;
        smoothed = raw;
        return smoothed;
      }

      const deltaMs = clamp(timestampMs - lastTimestampMs, 1, 5000);
      lastTimestampMs = timestampMs;

      if (Math.abs(shortestAngleDelta(smoothed, raw)) < HEADING_DEADBAND_DEGREES) {
        return smoothed;
      }

      const alpha = deltaMs / (tauMs + deltaMs);
      sin += alpha * (Math.sin(radians) - sin);
      cos += alpha * (Math.cos(radians) - cos);

      const target = normalizeAngle((Math.atan2(sin, cos) * 180) / Math.PI);
      const maxStep = (MAX_HEADING_RATE_DEG_PER_SECOND * deltaMs) / 1000;
      const step = shortestAngleDelta(smoothed, target);

      smoothed = normalizeAngle(smoothed + clamp(step, -maxStep, maxStep));
      return smoothed;
    },
    reset() {
      sin = null;
      cos = null;
      lastTimestampMs = null;
      smoothed = 0;
    },
    value() {
      return smoothed;
    },
  };
}

/**
 * Zoom que mantém ~25s de estrada visível à frente: afasta sozinho na rodovia e
 * aproxima ao entrar na cidade.
 */
export function zoomForSpeed(
  speedMps: number,
  latitude: number,
  mapHeight: number,
): number {
  if (!Number.isFinite(mapHeight) || mapHeight <= 0 || !Number.isFinite(latitude)) {
    return DEFAULT_NAVIGATION_ZOOM;
  }

  const speed = Number.isFinite(speedMps) && speedMps > 0 ? speedMps : 0;
  const aheadMeters = Math.max(MIN_LOOK_AHEAD_METERS, speed * LOOK_AHEAD_SECONDS);
  const metersPerPixelTarget = aheadMeters / (mapHeight * LOOK_AHEAD_VIEWPORT_RATIO);

  if (metersPerPixelTarget <= 0) return DEFAULT_NAVIGATION_ZOOM;

  const zoom = Math.log2(
    (METERS_PER_PIXEL_AT_ZOOM_0 * Math.cos((latitude * Math.PI) / 180)) /
      metersPerPixelTarget,
  );

  if (!Number.isFinite(zoom)) return DEFAULT_NAVIGATION_ZOOM;

  return clamp(zoom, MIN_NAVIGATION_ZOOM, MAX_NAVIGATION_ZOOM);
}

export function pitchForSpeed(speedMps: number): number {
  if (!Number.isFinite(speedMps) || speedMps <= 0) return MIN_NAVIGATION_PITCH;

  const ratio = clamp(speedMps, 0, PITCH_MAX_SPEED_MPS) / PITCH_MAX_SPEED_MPS;
  return MIN_NAVIGATION_PITCH + (MAX_NAVIGATION_PITCH - MIN_NAVIGATION_PITCH) * ratio;
}

/**
 * Padding superior desloca o centro da câmera para baixo, deixando o usuário a
 * ~77% da altura e liberando a tela para o caminho à frente.
 */
export function getNavigationMapPadding(mapHeight: number) {
  const top =
    Number.isFinite(mapHeight) && mapHeight > 0
      ? Math.round(mapHeight * (2 * USER_SCREEN_RATIO - 1))
      : 0;

  return { bottom: 0, left: 0, right: 0, top };
}
