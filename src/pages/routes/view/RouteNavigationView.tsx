import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { getCurrentUserId } from "@/lib/auth";
import {
  ensureRouteBackgroundTracking,
  stopRouteBackgroundTracking,
} from "@/lib/route-background-tracking";
import { getApiErrorMessage } from "@/lib/password-reset";
import { colors } from "@/theme/colors";

import { RouteCompletedView } from "../components/RouteCompletedView";
import { RouteNavigationControls } from "../components/RouteNavigationControls";
import { RouteNavigationInstructionCard } from "../components/RouteNavigationInstructionCard";
import { RouteNavigationMap } from "../components/RouteNavigationMap";
import { RouteNavigationStatsCard } from "../components/RouteNavigationStatsCard";
import { RouteNavigationStopConfirmSheet } from "../components/RouteNavigationStopConfirmSheet";
import { useRouteLiveLocations } from "../hooks/useRouteLiveLocations";
import { useRouteNavigation } from "../hooks/useRouteNavigation";
import { updateRouteStatus } from "../services/routes.service";
import { setActiveNavigationRouteId } from "../stores/active-navigation-store";
import { getRouteTripDurationSeconds } from "../utils/route-trip-time.utils";

type RouteNavigationViewProps = {
  onBack: () => void;
  routeId: string;
};

type NavigationPhase = "navigating" | "completed";

export function RouteNavigationView({ onBack, routeId }: RouteNavigationViewProps) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<NavigationPhase>("navigating");
  const [isFinishing, setIsFinishing] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [tripDurationSeconds, setTripDurationSeconds] = useState(0);
  const [tripDistanceMeters, setTripDistanceMeters] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const navigation = useRouteNavigation({ routeId });
  const liveLocations = useRouteLiveLocations({
    currentPosition: navigation.state.currentPosition,
    enabled: phase === "navigating" && !navigation.state.isLoading && !navigation.state.error,
    heading: navigation.state.heading,
    routeId,
  });

  const route = navigation.state.route;
  const isOwner =
    route?.isOwner === true ||
    (currentUserId != null && route?.createdById === currentUserId);

  const navigateToDetail = useCallback(() => {
    setActiveNavigationRouteId(null);
    setShowStopConfirm(false);
    router.replace(`/routes/${routeId}` as Href);
  }, [routeId]);

  useEffect(() => {
    void getCurrentUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    if (!route || route.status !== "in_progress") return;

    void ensureRouteBackgroundTracking(route.id, route.title).catch((error) => {
      Toast.show({
        text1: "Rastreamento em segundo plano",
        text2: getApiErrorMessage(
          error,
          "Permita localização em segundo plano para continuar rastreado ao sair do app.",
        ),
        type: "error",
      });
    });
  }, [route?.id, route?.status, route?.title]);

  const finishRoute = useCallback(async () => {
    if (isFinishing || !isOwner) return;

    setIsFinishing(true);

    const route = navigation.state.route;
    setTripDurationSeconds(route ? getRouteTripDurationSeconds(route) : 0);
    setTripDistanceMeters(navigation.state.traveledDistanceMeters);

    try {
      if (navigation.state.route?.status !== "finished") {
        await updateRouteStatus(routeId, "finished");
      }
      await stopRouteBackgroundTracking();
      setActiveNavigationRouteId(null);
      setShowStopConfirm(false);
      setPhase("completed");
    } catch (error) {
      Toast.show({
        text1: "Não foi possível finalizar a rota",
        text2: getApiErrorMessage(error, "Tente novamente em instantes."),
        type: "error",
      });
    } finally {
      setIsFinishing(false);
    }
  }, [
    isFinishing,
    isOwner,
    navigation.state.route,
    navigation.state.traveledDistanceMeters,
    routeId,
  ]);

  const openStopConfirm = useCallback(() => {
    if (!isOwner) {
      navigateToDetail();
      return;
    }

    setShowStopConfirm(true);
  }, [isOwner, navigateToDetail]);

  const closeStopConfirm = useCallback(() => {
    if (isFinishing) return;
    setShowStopConfirm(false);
  }, [isFinishing]);

  const handleConfirmStop = useCallback(() => {
    void finishRoute();
  }, [finishRoute]);

  useEffect(() => {
    if (!navigation.state.isArrived || phase !== "navigating" || !isOwner) return;
    void finishRoute();
  }, [finishRoute, isOwner, navigation.state.isArrived, phase]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      openStopConfirm();
      return true;
    });

    return () => subscription.remove();
  }, [openStopConfirm]);

  const handleCloseCompleted = useCallback(() => {
    router.replace({
      params: { tab: "mine" },
      pathname: "/routes",
    } as Href);
  }, []);

  const handleSubmitRating = useCallback(async (_rating: number, _comment: string) => {
    await Promise.resolve();
  }, []);

  if (navigation.state.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brandDark} size="large" />
        <Text style={styles.loadingText}>Preparando navegação...</Text>
      </View>
    );
  }

  if (navigation.state.error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{navigation.state.error}</Text>
        <Button size="default" onPress={() => void navigation.reload()}>
          Tentar novamente
        </Button>
        <Button size="default" variant="secondary" onPress={onBack}>
          Voltar
        </Button>
      </View>
    );
  }

  if (phase === "completed") {
    return (
      <RouteCompletedView
        distanceMeters={tripDistanceMeters || navigation.state.traveledDistanceMeters}
        durationSeconds={
          tripDurationSeconds ||
          (navigation.state.route
            ? getRouteTripDurationSeconds(navigation.state.route)
            : 0)
        }
        onClose={handleCloseCompleted}
        onSubmitRating={handleSubmitRating}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <RouteNavigationMap
        followUser={navigation.followUser}
        partners={liveLocations.partners}
        state={navigation.state}
        onUserInteraction={() => navigation.toggleFollowUser(false)}
      />

      <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
        <RouteNavigationInstructionCard
          activeStepIndex={navigation.state.activeStepIndex}
          items={navigation.state.maneuverCarousel}
        />
      </View>

      <View pointerEvents="box-none" style={[styles.controlsWrap, { bottom: insets.bottom + 132 }]}>
        <RouteNavigationControls onRecenter={navigation.recenter} />
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <RouteNavigationStatsCard canFinish={isOwner} state={navigation.state} onStop={openStopConfirm} />
      </View>

      {isOwner ? (
        <RouteNavigationStopConfirmSheet
          destinationLabel={route?.destinationLabel ?? "Destino"}
          isFinishing={isFinishing}
          routeTitle={route?.title ?? "Passeio em andamento"}
          traveledDistanceMeters={navigation.state.traveledDistanceMeters}
          tripDurationSeconds={route ? getRouteTripDurationSeconds(route) : 0}
          visible={showStopConfirm}
          onClose={closeStopConfirm}
          onConfirm={handleConfirmStop}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  controlsWrap: {
    position: "absolute",
    right: 16,
  },
  errorTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    position: "absolute",
    right: 0,
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 14,
  },
  overlay: {
    left: 16,
    position: "absolute",
    right: 16,
    top: 0,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});
