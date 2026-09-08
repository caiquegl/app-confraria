const BRAZIL_TIME_ZONE = "America/Sao_Paulo";
const BRAZIL_OFFSET = "-03:00";
const BR_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

export type EventPeriodLegacyInput = {
  date?: string | null;
  endTime?: string | null;
  endsAt?: string | null;
  startTime?: string | null;
  startsAt?: string | null;
};

export type ResolvedEventPeriod = {
  endTime: string | null;
  endsAt: string;
  startTime: string | null;
  startsAt: string;
};

export function formatEventPeriodLabel(input: {
  endsAt: string | Date;
  endTime?: string | null;
  startsAt: string | Date;
  startTime?: string | null;
}): string {
  const startsAt = toDate(input.startsAt);
  const endsAt = toDate(input.endsAt);
  if (!startsAt || !endsAt) return "";

  const startDay = formatDayMonthShort(startsAt);
  const endDay = formatDayMonthShort(endsAt);
  const startTime = normalizeTime(input.startTime) ?? formatTimeInBrazil(startsAt);
  const endTime = normalizeTime(input.endTime) ?? formatTimeInBrazil(endsAt);

  if (formatDayKey(startsAt) === formatDayKey(endsAt)) {
    return `${startDay} · ${startTime}–${endTime}`;
  }

  return `${startDay}, ${startTime} → ${endDay}, ${endTime}`;
}

export function isEventOngoing(
  startsAt: string | Date,
  endsAt: string | Date,
  now: Date = new Date(),
): boolean {
  const start = toDate(startsAt);
  const end = toDate(endsAt);
  if (!start || !end) return false;

  const nowMs = now.getTime();
  return start.getTime() <= nowMs && nowMs <= end.getTime();
}

export function isEventEnded(endsAt: string | Date, now: Date = new Date()): boolean {
  const end = toDate(endsAt);
  if (!end) return false;
  return end.getTime() < now.getTime();
}

/**
 * Map API responses that may only have legacy `date` (+ times) into canonical ISO period.
 */
export function resolvePeriodFromLegacy(input: EventPeriodLegacyInput): ResolvedEventPeriod {
  const startsAtIso = parseIsoInstant(input.startsAt);
  const endsAtIso = parseIsoInstant(input.endsAt);

  if (startsAtIso && endsAtIso) {
    return {
      endsAt: endsAtIso.toISOString(),
      endTime: normalizeTime(input.endTime) ?? formatTimeInBrazil(endsAtIso),
      startsAt: startsAtIso.toISOString(),
      startTime: normalizeTime(input.startTime) ?? formatTimeInBrazil(startsAtIso),
    };
  }

  const dateValue = input.date?.trim() || "";
  const startTime = normalizeTime(input.startTime) ?? "00:00";
  const endTime = normalizeTime(input.endTime) ?? startTime;

  if (startsAtIso && !endsAtIso) {
    const endsAt = parseBrazilDateTime(formatBrazilianDateFromInstant(startsAtIso), endTime);
    return {
      endsAt: (endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : startsAtIso).toISOString(),
      endTime,
      startsAt: startsAtIso.toISOString(),
      startTime: normalizeTime(input.startTime) ?? formatTimeInBrazil(startsAtIso),
    };
  }

  if (dateValue) {
    const fromIsoDate = parseIsoInstant(dateValue);
    const calendarDate = fromIsoDate
      ? formatBrazilianDateFromInstant(fromIsoDate)
      : BR_DATE_RE.test(dateValue)
        ? dateValue
        : "";

    if (calendarDate) {
      const startsAt = parseBrazilDateTime(calendarDate, startTime);
      const endsAt = parseBrazilDateTime(calendarDate, endTime);

      if (startsAt && !Number.isNaN(startsAt.getTime()) && endsAt && !Number.isNaN(endsAt.getTime())) {
        return {
          endsAt: endsAt.toISOString(),
          endTime,
          startsAt: startsAt.toISOString(),
          startTime,
        };
      }
    }

    if (fromIsoDate) {
      return {
        endsAt: fromIsoDate.toISOString(),
        endTime: normalizeTime(input.endTime),
        startsAt: fromIsoDate.toISOString(),
        startTime: normalizeTime(input.startTime),
      };
    }
  }

  const fallback = new Date(0).toISOString();
  return {
    endsAt: endsAtIso?.toISOString() ?? fallback,
    endTime: normalizeTime(input.endTime),
    startsAt: startsAtIso?.toISOString() ?? fallback,
    startTime: normalizeTime(input.startTime),
  };
}

export function parseBrazilDateTime(dateValue: string, timeValue: string): Date | null {
  const brDateMatch = BR_DATE_RE.exec(dateValue.trim());
  const isoDateMatch = ISO_DATE_RE.exec(dateValue.trim());
  const timeMatch = TIME_RE.exec(timeValue.trim());

  if (!timeMatch) return null;

  let isoDate: string | null = null;

  if (brDateMatch) {
    const day = Number(brDateMatch[1]);
    const month = Number(brDateMatch[2]);
    const year = Number(brDateMatch[3]);
    const probe = new Date(year, month - 1, day, 12);

    if (
      probe.getFullYear() !== year ||
      probe.getMonth() !== month - 1 ||
      probe.getDate() !== day
    ) {
      return null;
    }

    isoDate = `${brDateMatch[3]}-${brDateMatch[2]}-${brDateMatch[1]}`;
  } else if (isoDateMatch) {
    isoDate = dateValue.trim();
  }

  if (!isoDate) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) return null;

  const date = new Date(`${isoDate}T${timeValue.trim()}:00${BRAZIL_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBrazilianDateFromInstant(instant: Date): string {
  const [year, month, day] = formatDayKey(instant).split("-");
  return `${day}/${month}/${year}`;
}

export function formatTimeInBrazil(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: BRAZIL_TIME_ZONE,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function formatDayMonthShort(date: Date): string {
  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);

  const month = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: BRAZIL_TIME_ZONE,
  })
    .format(date)
    .replace(/\./g, "")
    .trim()
    .toLowerCase();

  return `${day} ${month}`;
}

function formatDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
  }).format(date);
}

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseIsoInstant(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  return TIME_RE.test(trimmed) ? trimmed : null;
}
