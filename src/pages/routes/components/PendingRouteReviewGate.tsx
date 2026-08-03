import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppState, Modal, StyleSheet, View } from "react-native";

import {
  fetchPendingRouteReview,
  upsertRouteReview,
} from "../services/routes.service";
import {
  isRouteRatingUiOpen,
  subscribeRouteRatingUi,
} from "../stores/route-rating-ui-store";
import type { RouteApiResponse } from "../types/saved-route.types";
import { getRouteTripDurationSeconds } from "../utils/route-trip-time.utils";
import { RouteCompletedView } from "./RouteCompletedView";

type PendingRouteReviewGateProps = {
  enabled: boolean;
};

export function PendingRouteReviewGate({ enabled }: PendingRouteReviewGateProps) {
  const pathname = usePathname();
  const ratingUiOpen = useSyncExternalStore(
    subscribeRouteRatingUi,
    isRouteRatingUiOpen,
    () => false,
  );
  const [pendingRoute, setPendingRoute] = useState<RouteApiResponse | null>(null);
  const checkingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    if (!enabled || checkingRef.current) return;

    checkingRef.current = true;
    try {
      const route = await fetchPendingRouteReview();
      setPendingRoute(route);
    } catch {
      // Falha silenciosa: não bloqueia o app se a checagem cair.
    } finally {
      checkingRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPendingRoute(null);
      return;
    }

    void refreshPending();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshPending();
      }
    });

    return () => subscription.remove();
  }, [enabled, refreshPending]);

  useEffect(() => {
    if (!enabled) return;
    // Reabre ao focar a lista de rotas (ex.: saiu da avaliação sem salvar).
    if (pathname === "/routes" || pathname === "/routes/") {
      void refreshPending();
    }
  }, [enabled, pathname, refreshPending]);

  // Evita overlay duplo quando outra tela já está pedindo a avaliação.
  if (!pendingRoute || ratingUiOpen || pathname.includes("/navigate")) return null;

  return (
    <Modal animationType="slide" visible statusBarTranslucent>
      <View style={styles.screen}>
        <RouteCompletedView
          distanceMeters={pendingRoute.distanceMeters ?? 0}
          durationSeconds={getRouteTripDurationSeconds(pendingRoute)}
          onClose={() => setPendingRoute(null)}
          onSubmitRating={async (rating, comment) => {
            await upsertRouteReview(pendingRoute.id, { comment, rating });
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
