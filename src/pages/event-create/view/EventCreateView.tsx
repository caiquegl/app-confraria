import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";

import { EventStep1 } from "../components/EventStep1";
import { EventStep2 } from "../components/EventStep2";
import { EventStep3 } from "../components/EventStep3";
import { EventStep4 } from "../components/EventStep4";
import { createInitialEventDraft, EVENT_CREATE_TOTAL_STEPS } from "../services/event-create.service";
import type { EventDraft, EventDraftUpdate } from "../types/event-create.types";

type EventCreateViewProps = {
  onClose: () => void;
  onPublished: () => void;
  userId: string;
};

export function EventCreateView({ onClose, onPublished }: EventCreateViewProps) {
  const [draft, setDraft] = useState<EventDraft>(() => createInitialEventDraft());
  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);

  const updateDraft = useCallback<EventDraftUpdate>((key, value) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  }, []);

  const goNext = () => setStep((currentStep) => Math.min(currentStep + 1, EVENT_CREATE_TOTAL_STEPS));
  const goBack = () => setStep((currentStep) => Math.max(currentStep - 1, 1));

  const publishEvent = () => {
    if (isPublishing) return;

    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      Toast.show({
        type: "success",
        text1: "Evento publicado",
        text2: "Seu evento foi criado localmente por enquanto.",
      });
      onPublished();
    }, 650);
  };

  if (step === 1) {
    return (
      <EventStep1 draft={draft} updateDraft={updateDraft} onClose={onClose} onNext={goNext} />
    );
  }

  if (step === 2) {
    return (
      <EventStep2
        draft={draft}
        updateDraft={updateDraft}
        onBack={goBack}
        onClose={onClose}
        onNext={goNext}
      />
    );
  }

  if (step === 3) {
    return (
      <EventStep3
        draft={draft}
        updateDraft={updateDraft}
        onBack={goBack}
        onClose={onClose}
        onNext={goNext}
      />
    );
  }

  return (
    <EventStep4
      draft={draft}
      isPublishing={isPublishing}
      updateDraft={updateDraft}
      onBack={goBack}
      onClose={onClose}
      onPublish={publishEvent}
    />
  );
}
