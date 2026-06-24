import {
  formatBrazilianDateInput,
  formatTimeInput,
  isPastBrazilianDate,
  isValidBrazilianDate,
  isValidTime,
} from "@/pages/event-create/services/event-create.service";

export {
  formatBrazilianDateInput,
  formatTimeInput,
  isPastBrazilianDate,
  isValidBrazilianDate,
  isValidTime,
};

export function parseBrazilianDateTime(date: string, time: string): Date | null {
  if (!isValidBrazilianDate(date) || !isValidTime(time)) {
    return null;
  }

  const [day, month, year] = date.split("/").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function isPastBrazilianDateTime(date: string, time: string): boolean {
  const scheduled = parseBrazilianDateTime(date, time);
  if (!scheduled) return false;

  return scheduled.getTime() <= Date.now();
}

export type RouteScheduleValidation = {
  dateError: string | null;
  isComplete: boolean;
  isValid: boolean;
  timeError: string | null;
};

export function validateRouteSchedule(date: string, time: string): RouteScheduleValidation {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim();
  const isComplete = trimmedDate.length === 10 && trimmedTime.length === 5;

  if (!trimmedDate) {
    return {
      dateError: "Data obrigatória.",
      isComplete: false,
      isValid: false,
      timeError: trimmedTime ? null : "Hora obrigatória.",
    };
  }

  if (!trimmedTime) {
    return {
      dateError: trimmedDate.length === 10 && !isValidBrazilianDate(trimmedDate)
        ? "Informe uma data válida."
        : trimmedDate.length === 10 && isPastBrazilianDate(trimmedDate)
          ? "Não é permitido agendar em data passada."
          : null,
      isComplete: false,
      isValid: false,
      timeError: "Hora obrigatória.",
    };
  }

  if (!isValidBrazilianDate(trimmedDate)) {
    return {
      dateError: "Informe uma data válida.",
      isComplete,
      isValid: false,
      timeError: !isValidTime(trimmedTime) ? "Informe um horário válido." : null,
    };
  }

  if (isPastBrazilianDate(trimmedDate)) {
    return {
      dateError: "Não é permitido agendar em data passada.",
      isComplete,
      isValid: false,
      timeError: null,
    };
  }

  if (!isValidTime(trimmedTime)) {
    return {
      dateError: null,
      isComplete,
      isValid: false,
      timeError: "Informe um horário válido.",
    };
  }

  if (isPastBrazilianDateTime(trimmedDate, trimmedTime)) {
    return {
      dateError: null,
      isComplete,
      isValid: false,
      timeError: "O horário precisa ser no futuro.",
    };
  }

  return {
    dateError: null,
    isComplete,
    isValid: true,
    timeError: null,
  };
}
