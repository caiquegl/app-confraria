import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

import { appLog } from "@/lib/app-log";
import { fetchCreatedPublicProfileEvents } from "@/pages/public-profile-events/services/public-profile-events.service";
import { FreeRouteLimitPaywall } from "@/pages/routes/components/FreeRouteLimitPaywall";
import { fetchSubscriptionMe } from "@/pages/subscription/services/subscription.service";

import { EventCreatedSuccessModal } from "../components/EventCreatedSuccessModal";
import { EventStep1 } from "../components/EventStep1";
import { EventStep2 } from "../components/EventStep2";
import { EventStep3 } from "../components/EventStep3";
import { EventStep4 } from "../components/EventStep4";
import { useEventCreateDraft } from "../hooks/useEventCreateDraft";
import { createEvent, fetchEventCategories } from "../services/event-create.service";
import type { EventCategory } from "../types/event-create.types";
import { isFreeEventLimitError } from "../utils/free-event-limit.utils";

const FREE_ACTIVE_EVENT_LIMIT = 2;

type EventCreateViewProps = {
  onClose: () => void;
  onPublished: () => void;
  userId: string;
};

export function EventCreateView({ onClose, onPublished, userId }: EventCreateViewProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [showEventLimitPaywall, setShowEventLimitPaywall] = useState(false);
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

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [subscription, createdEvents] = await Promise.all([
          fetchSubscriptionMe(),
          fetchCreatedPublicProfileEvents(userId),
        ]);
        if (!isMounted || subscription.isVip) return;

        const now = Date.now();
        const activeCount = createdEvents.filter(
          (event) => new Date(event.endsAt).getTime() >= now,
        ).length;

        if (activeCount >= FREE_ACTIVE_EVENT_LIMIT) {
          setShowEventLimitPaywall(true);
        }
      } catch {
        // Backend still enforces the limit on publish.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const openSubscription = () => {
    setShowEventLimitPaywall(false);
    onClose();
    router.push("/profile/subscription" as Href);
  };

  const publishEvent = async () => {
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      await createEvent(buildPayload());
      appLog.info("event publish success", { userId });
      setSuccessVisible(true);
    } catch (error) {
      if (isFreeEventLimitError(error)) {
        appLog.info("event publish blocked by free limit", { userId });
        setShowEventLimitPaywall(true);
        return;
      }

      appLog.warn("event publish failed", {
        reason: error instanceof Error ? error.message : "unknown",
        userId,
      });
      Toast.show({
        type: "error",
        text1: "Não foi possível criar o evento",
        text2: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const paywall = (
    <FreeRouteLimitPaywall
      description="No plano gratuito você pode ter até 2 eventos ativos ao mesmo tempo. Com o Premium, organize quantos quiser e alcance mais motociclistas."
      title="Organize mais eventos com o Premium"
      visible={showEventLimitPaywall}
      onClose={() => {
        setShowEventLimitPaywall(false);
        onClose();
      }}
      onSubscribe={openSubscription}
    />
  );

  if (step === 1) {
    return (
      <>
        <EventStep1
          categories={categories}
          categoriesError={categoriesError}
          draft={draft}
          isLoadingCategories={isLoadingCategories}
          updateDraft={updateDraft}
          onClose={onClose}
          onNext={goNext}
        />
        {paywall}
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <EventStep2
          draft={draft}
          updateDraft={updateDraft}
          onBack={goBack}
          onClose={onClose}
          onNext={goNext}
        />
        {paywall}
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <EventStep3
          draft={draft}
          updateDraft={updateDraft}
          onBack={goBack}
          onClose={onClose}
          onNext={goNext}
        />
        {paywall}
      </>
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
      {paywall}
    </>
  );
}
