import { useCallback, useMemo, useState } from "react";

import { createInitialEventDraft } from "@/pages/event-create/services/event-create.service";
import type {
  EventCreatePayload,
  EventDraft,
  EventDraftUpdate,
} from "@/pages/event-create/types/event-create.types";

export function useEventEditDraft(initialDraft: EventDraft, userId: string) {
  const [draft, setDraft] = useState<EventDraft>(initialDraft);

  const updateDraft = useCallback<EventDraftUpdate>((key, value) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  }, []);

  const buildPayload = useCallback((): EventCreatePayload => {
    return {
      category: draft.category.trim(),
      coverImageUri: nullableTrim(draft.image),
      date: draft.date.trim(),
      description: nullableTrim(draft.description),
      destination: draft.destination,
      endTime: nullableTrim(draft.endTime),
      galleryUris: draft.gallery.filter(Boolean),
      hasParticipantLimit: draft.hasParticipantLimit,
      included: cleanList(draft.included),
      location: draft.location,
      maxParticipants: draft.hasParticipantLimit ? draft.maxParticipants ?? null : null,
      requirements: cleanList(draft.requirements),
      startTime: nullableTrim(draft.startTime),
      stops: draft.stops.filter((stop) => stop !== null),
      title: draft.title.trim(),
      userId,
    };
  }, [draft, userId]);

  const payload = useMemo(() => buildPayload(), [buildPayload]);

  return {
    buildPayload,
    draft,
    payload,
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

export { createInitialEventDraft };
