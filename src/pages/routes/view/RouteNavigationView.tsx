import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { ErrorState, isTechnicalErrorMessage } from "@/components/ErrorState";
import { getCurrentUserId } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/password-reset";
import {
  ensureRouteBackgroundTracking,
  stopRouteBackgroundTracking,
} from "@/lib/route-background-tracking";
import { NewPostCamera } from "@/pages/home/components/NewPostCamera";
import { NewPostComposer } from "@/pages/home/components/NewPostComposer";
import { PostSuccessModal } from "@/pages/home/components/PostSuccessModal";
import { NewStoryCamera } from "@/pages/stories/components/NewStoryCamera";
import { StorySuccessModal } from "@/pages/stories/components/StorySuccessModal";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { RouteCompletedView } from "../components/RouteCompletedView";
import { RouteMapPhotosCarouselModal } from "../components/RouteMapPhotosCarouselModal";
import { RouteMapPinCamera } from "../components/RouteMapPinCamera";
import { RouteNavigationControls } from "../components/RouteNavigationControls";
import { RouteNavigationInstructionCard } from "../components/RouteNavigationInstructionCard";
import { RouteNavigationMap } from "../components/RouteNavigationMap";
import {
  RouteNavigationMediaSheet,
  type RouteNavigationMediaAction,
} from "../components/RouteNavigationMediaSheet";
import { RouteNavigationStatsCard } from "../components/RouteNavigationStatsCard";
import { RouteNavigationReportSheet } from "../components/RouteNavigationReportSheet";
import { RouteNavigationStopConfirmSheet } from "../components/RouteNavigationStopConfirmSheet";
import { useRouteLiveLocations } from "../hooks/useRouteLiveLocations";
import { useRouteMapPhotos } from "../hooks/useRouteMapPhotos";
import { useRouteNavigation } from "../hooks/useRouteNavigation";
import { useRouteNavigationMedia } from "../hooks/useRouteNavigationMedia";
import { useRouteReports } from "../hooks/useRouteReports";
import { updateRouteStatus, upsertRouteReview } from "../services/routes.service";
import { setActiveNavigationRouteId } from "../stores/active-navigation-store";
import { setRouteRatingUiOpen } from "../stores/route-rating-ui-store";
import { getRouteTripDurationSeconds } from "../utils/route-trip-time.utils";

function NavigationKeepAwake() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  // Android rejeita deactivate se a Activity já morreu (background/killed).
  useKeepAwake("route-navigation", { suppressDeactivateWarnings: true });
  return null;
}

type RouteNavigationViewProps = {
  onBack: () => void;
  routeId: string;
};

type NavigationPhase = "navigating" | "completed";

export function RouteNavigationView({ onBack, routeId }: RouteNavigationViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<NavigationPhase>("navigating");
  const [isFinishing, setIsFinishing] = useState(false);
  const isFinishingRef = useRef(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [tripDurationSeconds, setTripDurationSeconds] = useState(0);
  const [tripDistanceMeters, setTripDistanceMeters] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const phaseRef = useRef(phase);
  const isOwnerRef = useRef(false);
  const finishRouteRef = useRef<() => void>(() => {});

  const handleArrived = useCallback(() => {
    if (phaseRef.current !== "navigating" || !isOwnerRef.current) return;
    finishRouteRef.current();
  }, []);

  const navigation = useRouteNavigation({
    onArrived: handleArrived,
    routeId,
  });
  const mapPhotos = useRouteMapPhotos({
    enabled: phase === "navigating" && !navigation.state.isLoading && !navigation.state.error,
    routeId,
  });
  const media = useRouteNavigationMedia({
    getCurrentCoords: () => navigation.state.currentPosition,
    onMapPhotoCreated: mapPhotos.upsertPhoto,
    routeId,
  });
  const liveLocations = useRouteLiveLocations({
    currentPosition: navigation.state.currentPosition,
    enabled: phase === "navigating" && !navigation.state.isLoading && !navigation.state.error,
    heading: navigation.state.heading,
    routeId,
  });

  const reports = useRouteReports({
    enabled:
      phase === "navigating" && !navigation.state.isLoading && !navigation.state.error,
    routeId,
  });

  const handleMediaAction = useCallback(
    (action: RouteNavigationMediaAction) => {
      if (action === "story") {
        media.openStoryCamera();
        return;
      }
      if (action === "feed") {
        media.openFeedCamera();
        return;
      }
      media.openMapPinCamera();
    },
    [media.openFeedCamera, media.openMapPinCamera, media.openStoryCamera],
  );

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
    if (isFinishingRef.current || !isOwner) return;

    isFinishingRef.current = true;
    navigation.stopNavigationUpdates();
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
      isFinishingRef.current = false;
      setIsFinishing(false);
    }
  }, [
    isOwner,
    navigation,
    routeId,
  ]);

  useEffect(() => {
    phaseRef.current = phase;
    isOwnerRef.current = isOwner;
    finishRouteRef.current = () => {
      void finishRoute();
    };
  }, [finishRoute, isOwner, phase]);

  const openStopConfirm = useCallback(() => {
    if (!isOwner) {
      navigateToDetail();
      return;
    }

    setShowStopConfirm(true);
  }, [isOwner, navigateToDetail]);

  const closeStopConfirm = useCallback(() => {
    if (isFinishing) return;
    navigation.resumeNavigationUpdates();
    setShowStopConfirm(false);
  }, [isFinishing, navigation]);

  const handleConfirmStop = useCallback(() => {
    void finishRoute();
  }, [finishRoute]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      openStopConfirm();
      return true;
    });

    return () => subscription.remove();
  }, [openStopConfirm]);

  useEffect(() => {
    if (phase !== "completed") return;
    setRouteRatingUiOpen(true);
    return () => setRouteRatingUiOpen(false);
  }, [phase]);

  const handleCloseCompleted = useCallback(() => {
    setRouteRatingUiOpen(false);
    router.replace("/routes/mine" as Href);
  }, []);

  const handleSubmitRating = useCallback(
    async (rating: number, comment: string) => {
      await upsertRouteReview(routeId, {
        comment,
        rating,
      });
    },
    [routeId],
  );

  if (navigation.state.error) {
    const isFinished = navigation.state.error === "Esta rota já foi finalizada";
    const title = isTechnicalErrorMessage(navigation.state.error)
      ? "Não foi possível iniciar a navegação"
      : navigation.state.error;

    return (
      <ErrorState
        description={
          isFinished
            ? "Volte para os detalhes da rota."
            : "Verifique a conexão e tente novamente."
        }
        retrying={navigation.state.isLoading}
        secondaryAction={{
          accessibilityLabel: "Voltar",
          label: "Voltar",
          onPress: onBack,
        }}
        style={styles.errorState}
        title={title}
        onRetry={() => void navigation.reload()}
      />
    );
  }

  if (navigation.state.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brandDark} size="large" />
        <Text style={styles.loadingText}>Preparando navegação...</Text>
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

  const isAnyCameraOpen =
    media.isMapPinCameraOpen || media.isStoryCameraOpen || media.isCameraOpen;

  return (
    <View style={styles.screen}>
      <NavigationKeepAwake />
      {/* Desmonta o MapView com câmera aberta: no Android a surface do mapa deixa a câmera/previews pretos. */}
      {!isAnyCameraOpen ? (
        <RouteNavigationMap
          followUser={navigation.followUser}
          partners={liveLocations.partners}
          reports={reports.reports}
          photoClusters={mapPhotos.clusters}
          state={navigation.state}
          onPhotoClusterPress={mapPhotos.openCluster}
          onUserInteraction={() => navigation.toggleFollowUser(false)}
        />
      ) : (
        <View style={styles.cameraBackdrop} />
      )}

      <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top + 4 }]}>
        <RouteNavigationInstructionCard
          activeStepIndex={navigation.state.activeStepIndex}
          items={navigation.state.maneuverCarousel}
        />
      </View>

      <View pointerEvents="box-none" style={[styles.controlsWrap, { bottom: insets.bottom + 132 }]}>
        <RouteNavigationControls
          onOpenMedia={media.openMediaSheet}
          onRecenter={navigation.recenter}
          onReport={() => setShowReport(true)}
        />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.minimizeWrap, { bottom: insets.bottom + 148 }]}
      >
        <Pressable
          accessibilityLabel="Minimizar mapa e continuar navegando"
          accessibilityRole="button"
          style={({ pressed }) => [styles.minimizeButton, pressed && styles.minimizeButtonPressed]}
          onPress={() => {
            router.replace("/routes" as Href);
          }}
        >
          <Ionicons color={colors.text.inverse} name="remove-outline" size={14} />
          <Text style={styles.minimizeText}>Minimizar mapa</Text>
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <RouteNavigationStatsCard
          canFinish={isOwner}
          isOffRoute={navigation.state.isOffRoute}
          state={navigation.state}
          onStop={openStopConfirm}
        />
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

      <RouteNavigationReportSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
        onSelect={(type) => {
          void reports.sendReport(type, navigation.state.currentPosition);
        }}
      />

      <RouteNavigationMediaSheet
        visible={media.isMediaSheetVisible}
        onClose={media.closeMediaSheet}
        onSelect={handleMediaAction}
      />

      <NewStoryCamera
        isPublishing={media.isStoryUploading}
        selectedMedia={media.selectedStoryMedia}
        uploadProgress={media.storyUploadProgress}
        visible={media.isStoryCameraOpen}
        onClose={media.closeStoryCamera}
        onPublish={media.publishStory}
        onSelectMedia={media.setSelectedStoryMedia}
      />

      <StorySuccessModal
        visible={media.isStorySuccessVisible}
        onContinue={media.closeStorySuccess}
      />

      <NewPostCamera
        capturedMedia={media.cameraMedia}
        visible={media.isCameraOpen}
        onAddMedia={media.addCameraMedia}
        onClose={media.closeNewPostCamera}
        onDone={media.openComposerFromCamera}
        onGallerySelected={media.openComposerFromGallery}
      />

      <NewPostComposer
        activePhotoIndex={media.composeActivePhotoIndex}
        audience={media.composeAudience}
        caption={media.composeCaption}
        media={media.composerMedia}
        postUploadProgress={media.postUploadProgress}
        publishing={media.isPublishingPost}
        restrictToFollowers={media.isComposerRestrictedToFollowers}
        visible={media.isComposerOpen}
        onBack={media.closeComposer}
        onChangeActivePhotoIndex={media.setComposeActivePhotoIndex}
        onChangeAudience={media.setComposeAudience}
        onChangeCaption={media.setComposeCaption}
        onRemovePhoto={media.removeComposerPhoto}
        onReorderPhotos={media.reorderComposerPhotos}
        onPublish={media.publishPost}
      />

      <PostSuccessModal
        visible={media.isPostSuccessVisible}
        onContinue={media.closePostSuccess}
      />

      <RouteMapPinCamera
        isUploading={media.isUploadingMapPin}
        visible={media.isMapPinCameraOpen}
        onClose={media.closeMapPinCamera}
        onConfirm={(uri) => {
          void media.confirmMapPinPhoto(uri);
        }}
      />

      <RouteMapPhotosCarouselModal
        photos={mapPhotos.selectedCluster?.photos ?? []}
        visible={mapPhotos.selectedCluster != null}
        onClose={mapPhotos.closeCluster}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  cameraBackdrop: {
    backgroundColor: colors.surface.video,
    flex: 1,
  },
  centered: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flex: 1,
    gap: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorState: {
    backgroundColor: colors.brandGray,
    flex: 1,
    justifyContent: "center",
    paddingTop: 0,
  },
  controlsWrap: {
    position: "absolute",
    right: 16,
  },
  footer: {
    bottom: 0,
    elevation: 30,
    left: 0,
    paddingHorizontal: 16,
    position: "absolute",
    right: 0,
    zIndex: 30,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  minimizeButton: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: colors.surface.video,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  minimizeButtonPressed: {
    opacity: 0.85,
  },
  minimizeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "700",
  },
  minimizeWrap: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
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
