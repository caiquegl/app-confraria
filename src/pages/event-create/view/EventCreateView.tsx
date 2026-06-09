import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

import { EventCreatedSuccessModal } from "../components/EventCreatedSuccessModal";
import { EventStep1 } from "../components/EventStep1";
import { EventStep2 } from "../components/EventStep2";
import { EventStep3 } from "../components/EventStep3";
import { EventStep4 } from "../components/EventStep4";
import { useEventCreateDraft } from "../hooks/useEventCreateDraft";
import { createEvent, fetchEventCategories } from "../services/event-create.service";
import type { EventCategory } from "../types/event-create.types";

type EventCreateViewProps = {
  onClose: () => void;
  onPublished: () => void;
  userId: string;
};

export function EventCreateView({ onClose, onPublished, userId }: EventCreateViewProps) {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const { buildPayload, draft, goBack, goNext, step, updateDraft } = useEventCreateDraft(userId);

  useEffect(() => {
    let isMounted = true;

    void fetchEventCategories()
      .then((eventCategories) => {
        if (!isMounted) return;
        setCategories(eventCategories);
        setCategoriesError(false);
      })
      .catch(() => {
        if (isMounted) setCategoriesError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const publishEvent = async () => {
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      await createEvent(buildPayload());
      setSuccessVisible(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Não foi possível criar o evento",
        text2: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (step === 1) {
    return (
      <EventStep1
        categories={categories}
        categoriesError={categoriesError}
        draft={draft}
        isLoadingCategories={isLoadingCategories}
        updateDraft={updateDraft}
        onClose={onClose}
        onNext={goNext}
      />
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
    <>
      <EventStep4
        draft={draft}
        isPublishing={isPublishing}
        updateDraft={updateDraft}
        onBack={goBack}
        onClose={onClose}
        onPublish={publishEvent}
      />
      <EventCreatedSuccessModal
        visible={successVisible}
        onContinue={() => {
          setSuccessVisible(false);
          onPublished();
        }}
      />
    </>
  );
}
