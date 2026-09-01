import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { useEnvironmentBannerSuppression } from "@/components/EnvironmentBanner";
import { LocationGate } from "@/components/LocationGate";
import type { GeolocationState } from "@/lib/location";
import { useGeolocation } from "@/lib/location";
import { getApiErrorMessage } from "@/lib/password-reset";
import { fetchSubscriptionMe } from "@/pages/subscription/services/subscription.service";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { RouteCreateStep1 } from "../components/RouteCreateStep1";
import { RouteCreateStep2 } from "../components/RouteCreateStep2";
import { RouteCreateStep3 } from "../components/RouteCreateStep3";
import { RouteCreateStep4 } from "../components/RouteCreateStep4";
import { FreeRouteLimitPaywall } from "../components/FreeRouteLimitPaywall";
import { RoutePlannerMap } from "../components/RoutePlannerMap";
import { RoutePlannerSheet } from "../components/RoutePlannerSheet";
import { RouteWizardStepper } from "../components/RouteWizardStepper";
import { useRouteBikes } from "../hooks/useRouteBikes";
import { useRouteCostEstimate } from "../hooks/useRouteCostEstimate";
import { useRouteCreateDraft } from "../hooks/useRouteCreateDraft";
import { useRouteDaySuggestions } from "../hooks/useRouteDaySuggestions";
import { useRouteDirections } from "../hooks/useRouteDirections";
import { createRoute, fetchRoute, updateRoute } from "../services/routes.service";
import type { RouteCreateAction } from "../types/saved-route.types";
import type { WizardStep } from "../types/route-create.types";
import { buildCreateRoutePayload } from "../utils/build-create-route-payload";
import { isFreeRouteLimitError, isPremiumRouteStyleError } from "../utils/free-route-limit.utils";
import { mapApiRouteToEditSnapshot } from "../utils/map-api-route-to-edit";
import { buildRouteCreateSnapshotFromQuickRoute } from "../utils/quick-route-create.utils";
import {
  clearQuickRoutePlannerSnapshot,
  loadQuickRoutePlannerSnapshot,
} from "../utils/quick-route-planner.storage";
import { validateRouteSchedule } from "../utils/route-schedule.utils";
import { trackRoutesEvent } from "../utils/track-routes-event";

type RouteCreateWizardProps = {
  editRouteId?: string | null;
  location: GeolocationState;
};

function getContinueLabel(step: WizardStep): string {
  if (step === 1) return "Continuar para a moto";
  if (step === 2) return "Continuar para ajustes";
  if (step === 3) return "Ver resumo final";
  return "Continuar";
}

function canContinueWizardStep(
  step: WizardStep,
  draft: ReturnType<typeof useRouteCreateDraft>,
): boolean {
  if (step === 1) return draft.canContinueStep1;
  if (step === 2) return draft.canContinueStep2;
  if (step === 3) return draft.canContinueStep3;
  if (step === 4) return draft.canContinueStep4;
  return false;
}

function getMaxReachableWizardStep(
  currentStep: WizardStep,
  draft: ReturnType<typeof useRouteCreateDraft>,
): WizardStep {
  let maxReachable: WizardStep = 1;

  if (draft.canContinueStep1) {
    maxReachable = 2;
  }
  if (maxReachable >= 2 && draft.canContinueStep2) {
    maxReachable = 3;
  }
  if (maxReachable >= 3 && draft.canContinueStep3) {
    maxReachable = 4;
  }

  return Math.max(maxReachable, currentStep) as WizardStep;
}

function RouteCreateWizard({ editRouteId = null, location }: RouteCreateWizardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [quickPlannerSnapshot, setQuickPlannerSnapshot] = useState(
    null as ReturnType<typeof buildRouteCreateSnapshotFromQuickRoute> | null,
  );
  const [editSnapshot, setEditSnapshot] = useState(
    null as ReturnType<typeof mapApiRouteToEditSnapshot> | null,
  );
  const [loadedEditRouteId, setLoadedEditRouteId] = useState<string | null>(null);
  const [showFreeRoutePaywall, setShowFreeRoutePaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"limit" | "routeStyle">("limit");
  const [isPremium, setIsPremium] = useState(false);
  const isLoadingEdit = Boolean(editRouteId) && loadedEditRouteId !== editRouteId;

  useEffect(() => {
    let cancelled = false;

    void fetchSubscriptionMe()
      .then((subscription) => {
        if (!cancelled) {
          setIsPremium(subscription.isVip);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editRouteId) return;

    let cancelled = false;

    void loadQuickRoutePlannerSnapshot()
      .then((snapshot) => {
        if (cancelled || !snapshot) return;
        setQuickPlannerSnapshot(buildRouteCreateSnapshotFromQuickRoute(snapshot));
        void clearQuickRoutePlannerSnapshot();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [editRouteId]);

  useEffect(() => {
    if (!editRouteId) {
      return;
    }

    let cancelled = false;

    void fetchRoute(editRouteId)
      .then((route) => {
        if (cancelled) return;
        setEditSnapshot(mapApiRouteToEditSnapshot(route));
      })
      .catch(() => {
        if (cancelled) return;
        Toast.show({
          text1: "Não foi possível carregar a rota",
          text2: "Tente novamente em instantes.",
          type: "error",
        });
        router.back();
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedEditRouteId(editRouteId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editRouteId]);
  const sheetBottomInset = useMemo(() => {
    if (insets.bottom > 0) return insets.bottom;
    return Platform.OS === "android" ? 24 : 0;
  }, [insets.bottom]);
  const { setSuppressed } = useEnvironmentBannerSuppression();

  const draft = useRouteCreateDraft({
    editRouteId,
    initialOriginCoords:
      location.latitude != null && location.longitude != null
        ? { latitude: location.latitude, longitude: location.longitude }
        : null,
    initialOriginLabel: location.cityLabel,
    initialSnapshot: editSnapshot ?? quickPlannerSnapshot,
  });
  const { bikes, isLoading: isLoadingBikes } = useRouteBikes();
  const directions = useRouteDirections({
    activeDayId: draft.activeDayId,
    avoidTolls: draft.preferences.avoidTolls,
    avoidUnpaved: draft.preferences.avoidUnpaved,
    days: draft.days,
    routeStyle: draft.preferences.routeStyle,
  });

  const selectedBike = useMemo(
    () => bikes.find((bike) => bike.id === draft.motorcycle.bikeId) ?? null,
    [bikes, draft.motorcycle.bikeId],
  );

  const bikeRangeKm = useMemo(() => {
    if (!selectedBike) return null;
    return Math.round(selectedBike.baseConsumption * selectedBike.tankCapacity);
  }, [selectedBike]);

  const daySuggestions = useRouteDaySuggestions({
    bikeRangeKm,
    dayRoutePlans: directions.dayRoutePlans,
    days: draft.days,
    enabled: draft.step === 1,
  });

  const costEstimate = useRouteCostEstimate({
    avoidTolls: draft.preferences.avoidTolls,
    baseConsumption: selectedBike?.baseConsumption ?? null,
    days: draft.days,
    enabled: draft.step === 4,
    tollSummary: directions.tollSummary,
    totalDistanceMeters: directions.totalDistanceMeters,
  });

  const userLocation = useMemo(() => {
    if (location.latitude == null || location.longitude == null) {
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }, [location.latitude, location.longitude]);

  const [isSavingRoute, setIsSavingRoute] = useState(false);

  const canSaveScheduledRoute = useMemo(() => {
    if (draft.tripIntent !== "later") return true;
    return validateRouteSchedule(draft.tripDate, draft.tripTime).isValid;
  }, [draft.tripDate, draft.tripIntent, draft.tripTime]);

  const canContinue = canContinueWizardStep(draft.step, draft);
  const maxReachableStep = getMaxReachableWizardStep(draft.step, draft);
  const wizardStep = draft.step;
  const selectedBikeId = draft.motorcycle.bikeId;
  const setSelectedBikeId = draft.setSelectedBikeId;

  useEffect(() => {
    setSuppressed(draft.sheetState === "full");
    return () => {
      setSuppressed(false);
    };
  }, [draft.sheetState, setSuppressed]);

  useEffect(() => {
    if (wizardStep !== 2 || selectedBikeId || bikes.length === 0) {
      return;
    }

    const mainBike = bikes.find((bike) => bike.isMainBike) ?? bikes[0];
    if (mainBike) {
      setSelectedBikeId(mainBike.id);
    }
  }, [bikes, selectedBikeId, setSelectedBikeId, wizardStep]);

  const handleBack = () => {
    if (draft.step > 1) {
      draft.setStep((draft.step - 1) as WizardStep);
      return;
    }

    router.back();
  };

  const handleStepPress = (step: WizardStep) => {
    if (step === draft.step) return;
    if (step > maxReachableStep) return;
    draft.setStep(step);
  };

  const handleSheetExpandForKeyboard = useCallback(() => {
    draft.setSheetState("full");
  }, [draft.setSheetState]);

  const handleContinue = () => {
    if (draft.step === 1) {
      draft.setStep(2);
      return;
    }

    if (draft.step === 2) {
      draft.setStep(3);
      return;
    }

    if (draft.step === 3) {
      draft.setStep(4);
    }
  };

  const submitRoute = async (action: RouteCreateAction) => {
    if (isSavingRoute) return;

    const draftPayload = draft.payload;
    if (!draftPayload?.motorcycle.bikeId) {
      Toast.show({
        text1: "Selecione uma moto",
        type: "error",
      });
      return;
    }

    if (action === "save_for_later") {
      const scheduleValidation = validateRouteSchedule(draft.tripDate, draft.tripTime);
      if (!scheduleValidation.isValid) {
        Toast.show({
          text1: "Agendamento inválido",
          text2:
            scheduleValidation.dateError ??
            scheduleValidation.timeError ??
            "Preencha data e hora para salvar a rota.",
          type: "error",
        });
        return;
      }
    }

    setIsSavingRoute(true);

    try {
      const payload = buildCreateRoutePayload({
        action,
        coverImageUri:
          draft.thumbnailType === "image" ? draft.coverImageUri || null : null,
        daySummaries: directions.daySummaries,
        draftPayload,
        schedule: {
          tripDate: draft.tripDate,
          tripNote: draft.tripNote,
          tripTime: draft.tripTime,
        },
        thumbnailType: draft.thumbnailType,
        totals: {
          fuelCost: costEstimate.fuelCost,
          tollCost: costEstimate.tollCost,
          totalDistanceMeters: directions.totalDistanceMeters,
          totalDurationSeconds: directions.totalDurationSeconds,
        },
      });

      const coverUri =
        draft.thumbnailType === "image" ? draft.coverImageUri || null : null;

      if (editRouteId) {
        const { action: _action, ...updatePayload } = payload;
        await updateRoute(editRouteId, updatePayload, coverUri);
        await draft.clearCache();

        Toast.show({
          text1: "Rota atualizada",
          text2: "Suas alterações foram salvas.",
          type: "success",
        });

        router.replace(`/routes/${editRouteId}` as never);
        return;
      }

      const createdRoute = await createRoute(payload, coverUri);
      await draft.clearCache();

      if (action === "start_now") {
        Toast.show({
          text1: "Passeio iniciado",
          text2: "Abrindo navegação GPS.",
          type: "success",
        });

        router.replace(`/routes/${createdRoute.id}/navigate` as Href);
        return;
      }

      Toast.show({
        text1: "Rota agendada",
        text2: "Sua rota foi salva para o dia escolhido.",
        type: "success",
      });

      router.replace("/routes/mine" as Href);
    } catch (error) {
      if (isFreeRouteLimitError(error)) {
        trackRoutesEvent("free_route_limit_reached");
        setPaywallReason("limit");
        setShowFreeRoutePaywall(true);
        return;
      }

      if (isPremiumRouteStyleError(error)) {
        setPaywallReason("routeStyle");
        setShowFreeRoutePaywall(true);
        return;
      }

      Toast.show({
        text1: "Não foi possível salvar a rota",
        text2: getApiErrorMessage(error, "Tente novamente em instantes."),
        type: "error",
      });
    } finally {
      setIsSavingRoute(false);
    }
  };

  const handleStartTrip = () => {
    void submitRoute("start_now");
  };

  const handleSaveTrip = () => {
    void submitRoute("save_for_later");
  };

  const renderFooter = () => {
    if (draft.step === 4) {
      if (draft.tripIntent === "now") {
        return (
          <Button
            disabled={isSavingRoute}
            size="lg"
            style={styles.continueButton}
            onPress={handleStartTrip}
          >
            {isSavingRoute ? "Salvando..." : "Iniciar o passeio agora"}
          </Button>
        );
      }

      return (
        <View style={styles.step4Footer}>
          <TouchableOpacity
            activeOpacity={0.65}
            disabled={isSavingRoute || !canSaveScheduledRoute}
            style={[
              styles.saveTripButton,
              (isSavingRoute || !canSaveScheduledRoute) && styles.saveTripButtonDisabled,
            ]}
            onPress={handleSaveTrip}
          >
            <Ionicons color={colors.brandDark} name="save-outline" size={18} />
            <Text style={styles.saveTripButtonText}>
              {isSavingRoute ? "Salvando..." : "Salvar para depois"}
            </Text>
          </TouchableOpacity>
          <Button
            disabled={isSavingRoute}
            size="lg"
            style={styles.continueButton}
            variant="secondary"
            onPress={handleStartTrip}
          >
            Iniciar agora mesmo
          </Button>
        </View>
      );
    }

    return (
      <Button
        disabled={!canContinue}
        size="lg"
        style={styles.continueButton}
        onPress={handleContinue}
      >
        {getContinueLabel(draft.step)}
      </Button>
    );
  };

  if (isLoadingEdit || !draft.isCacheReady) {
    return (
      <View style={styles.cacheLoadingScreen}>
        <ActivityIndicator color={colors.brandDark} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RoutePlannerMap
        alternativeRoutes={directions.alternativeRoutes}
        isRecalculating={directions.isLoading}
        markers={draft.mapMarkers}
        selectedCoordinates={directions.selectedCoordinates}
        userLocation={userLocation}
        onSelectRouteOption={directions.selectRouteOption}
      />

      <View pointerEvents="box-none" style={[styles.backWrap, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
      </View>

      <RoutePlannerSheet
        bottomInset={sheetBottomInset}
        footer={renderFooter()}
        sheetState={draft.sheetState}
        stepper={
          <RouteWizardStepper
            currentStep={draft.step}
            maxReachableStep={maxReachableStep}
            onStepPress={handleStepPress}
          />
        }
        onKeyboardShow={handleSheetExpandForKeyboard}
        onSheetStateChange={draft.setSheetState}
      >
        {draft.step === 1 ? (
          <RouteCreateStep1
            activeDayId={draft.activeDayId}
            days={draft.days}
            getDaySuggestions={daySuggestions.getSuggestionsForDay}
            isLoadingMoreForDay={daySuggestions.isLoadingMoreForDay}
            isLoadingSuggestions={daySuggestions.isLoading}
            onAddDay={draft.addDay}
            onAddStop={draft.addStopToDay}
            onAddSuggestedStop={draft.addSuggestedStopToDay}
            onLoadMoreSuggestions={(dayId) => {
              void daySuggestions.loadMoreForDay(dayId);
            }}
            onChangeDayDestination={draft.setDayDestination}
            onChangeDayOrigin={draft.setDayOrigin}
            onChangeStop={draft.setStopPlace}
            onRemoveDay={draft.removeDay}
            onRemoveStop={draft.removeStopFromDay}
            onReorderWaypoints={draft.reorderDayWaypoints}
            onSelectDay={draft.setActiveDayId}
            onToggleDayOvernight={draft.toggleDayOvernight}
            isPremium={isPremium}
            routeStyle={draft.preferences.routeStyle}
            onRequestPremium={() => {
              setPaywallReason("routeStyle");
              setShowFreeRoutePaywall(true);
            }}
            onSelectRouteStyle={draft.setRouteStyle}
          />
        ) : null}

        {draft.step === 2 ? (
          <RouteCreateStep2
            bikes={bikes}
            isLoading={isLoadingBikes}
            selectedBikeId={draft.motorcycle.bikeId}
            onNavigateToMyBikes={() => router.push("/profile/bikes")}
            onSelectBike={(bike) => {
              draft.setSelectedBikeId(bike.id);
              draft.setStep(3);
            }}
          />
        ) : null}

        {draft.step === 3 ? (
          <RouteCreateStep3
            preferences={draft.preferences}
            onTogglePreference={draft.togglePreference}
          />
        ) : null}

        {draft.step === 4 ? (
          <RouteCreateStep4
            costEstimate={costEstimate}
            coverImageUri={draft.coverImageUri}
            daySummaries={directions.daySummaries}
            days={draft.days}
            preferences={draft.preferences}
            selectedBike={selectedBike}
            thumbnailType={draft.thumbnailType}
            totalDistanceMeters={directions.totalDistanceMeters}
            totalDurationSeconds={directions.totalDurationSeconds}
            tripDate={draft.tripDate}
            tripIntent={draft.tripIntent}
            tripNote={draft.tripNote}
            tripTime={draft.tripTime}
            onCoverImageChange={draft.setCoverImageUri}
            onRemoveCover={draft.clearRouteCover}
            onThumbnailTypeChange={draft.setThumbnailType}
            onTripDateChange={draft.setTripDate}
            onTripIntentChange={draft.setTripIntent}
            onTripNoteChange={draft.setTripNote}
            onTripTimeChange={draft.setTripTime}
          />
        ) : null}
      </RoutePlannerSheet>

      <FreeRouteLimitPaywall
        description={
          paywallReason === "routeStyle"
            ? "Sinuoso e Super-sinuoso são exclusivos do Premium. Assine para traçar rotas com mais curvas."
            : "No plano gratuito você pode salvar até 5 roteiros privados. Assine o Premium para salvar rotas ilimitadas."
        }
        title={paywallReason === "routeStyle" ? "Rotas sinuosas no Premium" : "Limite de rotas salvas"}
        visible={showFreeRoutePaywall}
        onClose={() => setShowFreeRoutePaywall(false)}
        onSubscribe={() => {
          setShowFreeRoutePaywall(false);
          router.push("/profile/subscription" as Href);
        }}
      />
    </View>
  );
}

export function RouteCreateView({ editRouteId = null }: { editRouteId?: string | null }) {
  const { location, requestPermission } = useGeolocation();

  if (location.status !== "ready" || !location.cityLabel) {
    return (
      <LocationGate
        canAskAgain={location.canAskAgain}
        purpose="routes"
        status={location.status}
        onRequestPermission={() => void requestPermission()}
      />
    );
  }

  return <RouteCreateWizard editRouteId={editRouteId} location={location} />;
}

const createStyles = (colors: AppColors) => ({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  backWrap: {
    left: 16,
    position: "absolute",
    top: 0,
    zIndex: 1100,
  },
  cacheLoadingScreen: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flex: 1,
    justifyContent: "center",
  },
  continueButton: {
    width: "100%",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
    overflow: "visible",
  },
  saveTripButton: {
    alignItems: "center",
    backgroundColor: colors.accent.brand,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  saveTripButtonDisabled: {
    opacity: 0.6,
  },
  saveTripButtonText: {
    color: colors.text.onBrand,
    fontSize: 16,
    fontWeight: "600",
  },
  step4Footer: {
    gap: 12,
    width: "100%",
  },
});
