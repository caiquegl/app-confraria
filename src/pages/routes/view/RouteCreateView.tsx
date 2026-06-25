import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { useEnvironmentBannerSuppression } from "@/components/EnvironmentBanner";
import { LocationGate } from "@/components/LocationGate";
import type { GeolocationState } from "@/lib/location";
import { useGeolocation } from "@/lib/location";
import { getApiErrorMessage } from "@/lib/password-reset";
import { colors } from "@/theme/colors";

import { RouteCreateStep1 } from "../components/RouteCreateStep1";
import { RouteCreateStep2 } from "../components/RouteCreateStep2";
import { RouteCreateStep3 } from "../components/RouteCreateStep3";
import { RouteCreateStep4 } from "../components/RouteCreateStep4";
import { RoutePlannerMap } from "../components/RoutePlannerMap";
import { RoutePlannerSheet } from "../components/RoutePlannerSheet";
import { RouteWizardStepper } from "../components/RouteWizardStepper";
import { useRouteBikes } from "../hooks/useRouteBikes";
import { useRouteCostEstimate } from "../hooks/useRouteCostEstimate";
import { useRouteCreateDraft } from "../hooks/useRouteCreateDraft";
import { useRouteDirections } from "../hooks/useRouteDirections";
import { createRoute, fetchRoute, updateRoute } from "../services/routes.service";
import type { RouteCreateAction } from "../types/saved-route.types";
import type { WizardStep } from "../types/route-create.types";
import { buildCreateRoutePayload } from "../utils/build-create-route-payload";
import { mapApiRouteToEditSnapshot } from "../utils/map-api-route-to-edit";
import { validateRouteSchedule } from "../utils/route-schedule.utils";

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

function RouteCreateWizard({ editRouteId = null, location }: RouteCreateWizardProps) {
  const insets = useSafeAreaInsets();
  const [editSnapshot, setEditSnapshot] = useState(
    null as ReturnType<typeof mapApiRouteToEditSnapshot> | null,
  );
  const [isLoadingEdit, setIsLoadingEdit] = useState(Boolean(editRouteId));

  useEffect(() => {
    if (!editRouteId) {
      setIsLoadingEdit(false);
      return;
    }

    let cancelled = false;
    setIsLoadingEdit(true);

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
          setIsLoadingEdit(false);
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
    initialSnapshot: editSnapshot,
  });
  const { bikes, isLoading: isLoadingBikes } = useRouteBikes();
  const directions = useRouteDirections({
    activeDayId: draft.activeDayId,
    avoidTolls: draft.preferences.avoidTolls,
    days: draft.days,
  });

  const selectedBike = useMemo(
    () => bikes.find((bike) => bike.id === draft.motorcycle.bikeId) ?? null,
    [bikes, draft.motorcycle.bikeId],
  );

  const costEstimate = useRouteCostEstimate({
    avoidTolls: draft.preferences.avoidTolls,
    baseConsumption: selectedBike?.baseConsumption ?? null,
    days: draft.days,
    enabled: draft.step === 4,
    tollSummary: directions.tollSummary,
    totalDistanceMeters: directions.totalDistanceMeters,
  });

  const userLocation =
    location.latitude != null && location.longitude != null
      ? { latitude: location.latitude, longitude: location.longitude }
      : null;

  const isRecalculating =
    directions.isLoading && directions.selectedCoordinates.length > 1;

  const [isSavingRoute, setIsSavingRoute] = useState(false);

  const canSaveScheduledRoute = useMemo(() => {
    if (draft.tripIntent !== "later") return true;
    return validateRouteSchedule(draft.tripDate, draft.tripTime).isValid;
  }, [draft.tripDate, draft.tripIntent, draft.tripTime]);

  const canContinue = canContinueWizardStep(draft.step, draft);

  useEffect(() => {
    setSuppressed(draft.sheetState === "full");
    return () => {
      setSuppressed(false);
    };
  }, [draft.sheetState, setSuppressed]);

  useEffect(() => {
    if (draft.step !== 2 || draft.motorcycle.bikeId || bikes.length === 0) {
      return;
    }

    const mainBike = bikes.find((bike) => bike.isMainBike) ?? bikes[0];
    if (mainBike) {
      draft.setSelectedBikeId(mainBike.id);
    }
  }, [bikes, draft.motorcycle.bikeId, draft.setSelectedBikeId, draft.step]);

  const handleBack = () => {
    if (draft.step > 1) {
      draft.setStep((draft.step - 1) as WizardStep);
      return;
    }

    router.back();
  };

  const handleStepPress = (step: WizardStep) => {
    if (step >= draft.step) return;
    draft.setStep(step);
  };

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
        daySummaries: directions.daySummaries,
        draftPayload,
        schedule: {
          tripDate: draft.tripDate,
          tripNote: draft.tripNote,
          tripTime: draft.tripTime,
        },
        totals: {
          fuelCost: costEstimate.fuelCost,
          tollCost: costEstimate.tollCost,
          totalDistanceMeters: directions.totalDistanceMeters,
          totalDurationSeconds: directions.totalDurationSeconds,
        },
      });

      if (editRouteId) {
        const { action: _action, ...updatePayload } = payload;
        await updateRoute(editRouteId, updatePayload);
        await draft.clearCache();

        Toast.show({
          text1: "Rota atualizada",
          text2: "Suas alterações foram salvas.",
          type: "success",
        });

        router.replace(`/routes/${editRouteId}` as never);
        return;
      }

      const createdRoute = await createRoute(payload);
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

      router.replace({
        params: { tab: "mine" },
        pathname: "/routes",
      });
    } catch (error) {
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
        disabled={!canContinue || isRecalculating}
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
        markers={draft.mapMarkers}
        selectedCoordinates={directions.selectedCoordinates}
        sheetState={draft.sheetState}
        userLocation={userLocation}
        onSelectRouteOption={directions.selectRouteOption}
      />

      <View pointerEvents="box-none" style={[styles.backWrap, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          disabled={isRecalculating}
          style={[styles.backButton, isRecalculating && styles.backButtonDisabled]}
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
            onStepPress={handleStepPress}
          />
        }
        onKeyboardShow={() => draft.setSheetState("full")}
        onToggleSize={draft.toggleSheetState}
      >
        {draft.step === 1 ? (
          <RouteCreateStep1
            activeDayId={draft.activeDayId}
            days={draft.days}
            onAddDay={draft.addDay}
            onAddStop={draft.addStopToDay}
            onChangeDayDestination={draft.setDayDestination}
            onChangeDayOrigin={draft.setDayOrigin}
            onChangeStop={draft.setStopPlace}
            onRemoveDay={draft.removeDay}
            onRemoveStop={draft.removeStopFromDay}
            onSelectDay={draft.setActiveDayId}
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
            daySummaries={directions.daySummaries}
            days={draft.days}
            preferences={draft.preferences}
            selectedBike={selectedBike}
            totalDistanceMeters={directions.totalDistanceMeters}
            totalDurationSeconds={directions.totalDurationSeconds}
            tripDate={draft.tripDate}
            tripIntent={draft.tripIntent}
            tripNote={draft.tripNote}
            tripTime={draft.tripTime}
            onTripDateChange={draft.setTripDate}
            onTripIntentChange={draft.setTripIntent}
            onTripNoteChange={draft.setTripNote}
            onTripTimeChange={draft.setTripTime}
          />
        ) : null}
      </RoutePlannerSheet>

      {isRecalculating ? (
        <View pointerEvents="auto" style={styles.recalculatingOverlay}>
          <View style={styles.recalculatingCard}>
            <ActivityIndicator color={colors.brandDark} size="large" />
            <Text style={styles.recalculatingTitle}>Recalculando rota...</Text>
            <Text style={styles.recalculatingSubtitle}>Aguarde enquanto atualizamos o mapa.</Text>
          </View>
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  backButtonDisabled: {
    opacity: 0.5,
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
  recalculatingCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    maxWidth: 280,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: "100%",
  },
  recalculatingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    justifyContent: "center",
    paddingHorizontal: 32,
    zIndex: 5000,
  },
  recalculatingSubtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  recalculatingTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
    overflow: "visible",
  },
  saveTripButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
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
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "600",
  },
  step4Footer: {
    gap: 12,
    width: "100%",
  },
});
