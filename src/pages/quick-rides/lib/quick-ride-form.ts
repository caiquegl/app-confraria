import { isValidTime } from "@/pages/event-create/services/event-create.service";

import {
  isQuickRideTimePast,
  type QuickRideDay,
} from "../services/quick-rides.service";

export const QUICK_RIDE_FIELD = {
  cancelReason: {
    autoCapitalize: "sentences" as const,
    helperText: "Os participantes recebem este motivo no aviso de cancelamento.",
    label: "Motivo do cancelamento",
    placeholder: "Ex.: choveu forte, vamos remarcar para outro dia.",
    required: true,
  },
  description: {
    autoCapitalize: "sentences" as const,
    helperText: "Conta o plano, o ritmo e qualquer parada no caminho.",
    label: "Descrição",
    placeholder: "Galera, bora de bate-volta? Parada pra café no caminho.",
    required: true,
  },
  maxParticipants: {
    helperText: "Mínimo de 1 pessoa.",
    keyboardType: "number-pad" as const,
    label: "Limite de gente",
    returnKeyType: "done" as const,
  },
  time: {
    helperText: "Use o formato HH:MM, por exemplo 07:30.",
    keyboardType: "numbers-and-punctuation" as const,
    label: "Horário",
    placeholder: "HH:MM",
    required: true,
    returnKeyType: "next" as const,
  },
  title: {
    autoCapitalize: "sentences" as const,
    label: "Nome do rolê",
    placeholder: "Tô indo pra Pedra Grande",
    required: true,
    returnKeyType: "next" as const,
  },
} as const;

export function normalizeMaxParticipantsInput(value: string): string {
  if (value === "") {
    return "";
  }

  const parsed = Math.max(1, Number(value));
  return Number.isFinite(parsed) ? String(parsed) : "1";
}

export function resolveMaxParticipants(
  hasLimit: boolean,
  maxParticipants: string,
): number | undefined {
  if (!hasLimit) {
    return undefined;
  }

  const parsed = Number(maxParticipants);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getQuickRideTimeError(day: QuickRideDay, time: string): string | undefined {
  const timeIsComplete = time.length === 5;
  const timeIsValid = isValidTime(time);

  if (time.length > 0 && (!timeIsComplete || !timeIsValid)) {
    return "Informe um horário válido (HH:MM).";
  }

  if (timeIsValid && isQuickRideTimePast(day, time)) {
    return "Esse horário já passou. Escolha um horário à frente.";
  }

  return undefined;
}

export function getRequiredTextError(value: string, message: string): string | undefined {
  if (value.trim().length > 0) {
    return undefined;
  }

  return message;
}
