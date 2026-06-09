import { useCallback, useMemo, useState } from "react";

import { createInitialEventDraft, EVENT_CREATE_TOTAL_STEPS } from "../services/event-create.service";
import type {
  EventCreatePayload,
  EventDraft,
  EventDraftUpdate,
} from "../types/event-create.types";

export function useEventCreateDraft(userId: string) {
  const [draft, setDraft] = useState<EventDraft>(() => createInitialEventDraft());
  const [step, setStep] = useState(1);

  const updateDraft = useCallback<EventDraftUpdate>((key, value) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  }, []);

  const goNext = useCallback(() => {
    setStep((currentStep) => Math.min(currentStep + 1, EVENT_CREATE_TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setStep((currentStep) => Math.max(currentStep - 1, 1));
  }, []);

  const buildPayload = useCallback(
    (): EventCreatePayload => ({
      category: draft.category.trim(),
      coverImageUri: nullableTrim(draft.image),
      date: draft.date.trim(),
      description: nullableTrim(draft.description),
      destination: nullableTrim(draft.destination),
      endTime: nullableTrim(draft.endTime),
      galleryUris: draft.gallery.filter(Boolean),
      hasParticipantLimit: draft.hasParticipantLimit,
      included: cleanList(draft.included),
      location: draft.location.trim(),
      maxParticipants: draft.hasParticipantLimit ? draft.maxParticipants ?? null : null,
      requirements: cleanList(draft.requirements),
      startTime: nullableTrim(draft.startTime),
      stops: cleanList(draft.stops),
      title: draft.title.trim(),
      userId,
    }),
    [draft, userId],
  );

  const payload = useMemo(() => buildPayload(), [buildPayload]);

  return {
    buildPayload,
    draft,
    goBack,
    goNext,
    payload,
    step,
    updateDraft,
  };
}

function nullableTrim(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function cleanList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}
