import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { PlaceAutocompleteField } from "@/components/PlaceAutocompleteField";
import type { PlaceReference } from "@/lib/places";
import { resolvePlaceWithCoords } from "@/lib/places";
import type { UserBike } from "@/pages/bikes/types/bikes.types";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { RoutePathOption } from "../hooks/useRouteDirections";
import type { QuickRoutePlace } from "../types/quick-route.types";
import { formatRouteDistance, formatRouteDuration } from "../utils/route-format.utils";
import { trackRoutesEvent } from "../utils/track-routes-event";
import { RouteCoverPicker } from "./RouteCoverPicker";
import { RouteBikePickerSheet } from "./RouteBikePickerSheet";
import { RouteStyleChips } from "./RouteStyleChips";
import type { RouteThumbnailType } from "../types/saved-route.types";
import type { RouteStyle } from "../types/route-style";

const GARAGE_ROUTE = "/profile/bikes" as Href;
const PLANNER_HINT_THRESHOLD = 2;

type QuickRouteSheetProps = {
  bikes: UserBike[];
  coverImageUri: string;
  destination: QuickRoutePlace;
  isLoadingBikes?: boolean;
  etaLabel: string | null;
  fuelCost: number | null;
  isCalculating: boolean;
  isLoadingFuel: boolean;
  isPersisting: boolean;
  isPremium: boolean;
  onAddStop: (place: QuickRoutePlace) => void;
  onCoverImageChange: (uri: string) => void;
  onPlanRoute: () => void;
  onRemoveCover: () => void;
  onSaveRoute: () => void;
  onSelectBike: (bikeId: string) => void;
  onStartRoute: () => void;
  onThumbnailTypeChange: (type: RouteThumbnailType) => void;
  onRequestPremium: () => void;
  onSelectRouteStyle: (style: RouteStyle) => void;
  routeError: string | null;
  routeStyle: RouteStyle;
  selectedBikeId: string | null;
  selectedOption: RoutePathOption | null;
  stops: QuickRoutePlace[];
  thumbnailType: RouteThumbnailType;
};

function toQuickPlace(
  place: PlaceReference & { latitude?: number; longitude?: number },
): QuickRoutePlace | null {
  if (place.latitude == null || place.longitude == null) return null;
  return {
    ...place,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function formatFuelCost(value: number | null): string {
  if (value == null) return "—";
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function getDistanceKm(distanceMeters: number | null): string {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (distanceMeters == null) return "—";
  return `${Math.round(distanceMeters / 1000)} km`;
}

export function QuickRouteSheet({
  bikes,
  coverImageUri,
  destination,
  isLoadingBikes = false,
  etaLabel,
  fuelCost,
  isCalculating,
  isLoadingFuel,
  isPersisting,
  isPremium,
  onAddStop,
  onCoverImageChange,
  onPlanRoute,
  onRemoveCover,
  onSaveRoute,
  onSelectBike,
  onStartRoute,
  onThumbnailTypeChange,
  onRequestPremium,
  onSelectRouteStyle,
  routeError,
  routeStyle,
  selectedBikeId,
  selectedOption,
  stops,
  thumbnailType,
}: QuickRouteSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [showStopSearch, setShowStopSearch] = useState(false);
  const [showBikePicker, setShowBikePicker] = useState(false);
  const [pendingStop, setPendingStop] = useState<PlaceReference | null>(null);

  const selectedBike = useMemo(
    () => bikes.find((bike) => bike.id === selectedBikeId) ?? bikes[0] ?? null,
    [bikes, selectedBikeId],
  );

  const canStart = Boolean(selectedBike && selectedOption && !isCalculating && !isPersisting);
  const suggestPlanner = stops.length >= PLANNER_HINT_THRESHOLD;

  const handleStopChange = (place: PlaceReference | null) => {
    if (!place) {
      setPendingStop(null);
      return;
    }

    setPendingStop(place);
    void resolvePlaceWithCoords(place)
      .then((resolved) => {
        const quickPlace = toQuickPlace(resolved);
        if (!quickPlace) {
          Toast.show({
            text1: "Endereço inválido",
            text2: "Selecione um local com coordenadas válidas.",
            type: "error",
          });
          return;
        }

        onAddStop(quickPlace);
        trackRoutesEvent("quick_route_stop_added");
        setPendingStop(null);
        setShowStopSearch(false);
      })
      .catch(() => {
        Toast.show({
          text1: "Não foi possível resolver o endereço",
          type: "error",
        });
      });
  };

  const handleSave = () => {
    onSaveRoute();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <Text numberOfLines={2} style={styles.destination}>
          {destination.mainText || destination.description}
        </Text>

        <RouteStyleChips
          compact
          isPremium={isPremium}
          value={routeStyle}
          onRequestPremium={onRequestPremium}
          onSelect={onSelectRouteStyle}
        />

        {isCalculating ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.brandDark} size="small" />
            <Text style={styles.loadingText}>Calculando rota...</Text>
          </View>
        ) : routeError ? (
          <Text style={styles.errorText}>{routeError}</Text>
        ) : selectedOption ? (
          <View style={styles.statsCard}>
            <View style={styles.statsColumn}>
              <Text style={styles.statsValue}>
                {formatRouteDuration(selectedOption.durationSeconds) ?? "—"}
              </Text>
              <Text style={styles.statsSub}>
                {getDistanceKm(selectedOption.distanceMeters)}
              </Text>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsColumn}>
              <Text style={styles.statsValue}>{etaLabel ?? "—"}</Text>
              <Text style={styles.statsSub}>Chegada estimada</Text>
            </View>
          </View>
        ) : null}

        {isLoadingBikes ? (
          <View style={styles.fuelBikeLoading}>
            <ActivityIndicator color={colors.brandDark} size="small" />
            <Text style={styles.fuelBikeLoadingText}>Carregando motos...</Text>
          </View>
        ) : selectedBike ? (
          <Pressable
            accessibilityRole="button"
            style={styles.fuelBikeCard}
            onPress={() => setShowBikePicker(true)}
          >
            <View style={styles.fuelIconWrap}>
              <MaterialCommunityIcons color={colors.brandPrimary} name="gas-station-outline" size={16} />
            </View>
            <View style={styles.fuelBikeCopy}>
              {isLoadingFuel ? (
                <ActivityIndicator color={colors.brandDark} size="small" />
              ) : (
                <Text style={styles.fuelValue}>
                  {formatFuelCost(fuelCost)}{" "}
                  <Text style={styles.fuelValueMuted}>estimados</Text>
                </Text>
              )}
              <Text numberOfLines={1} style={styles.fuelBikeMeta}>
                {`${selectedBike.brand.name} ${selectedBike.model}`.trim()} ·{" "}
                {selectedBike.baseConsumption} km/L
              </Text>
            </View>
            <Ionicons color={colors.border.default} name="chevron-forward" size={16} />
          </Pressable>
        ) : (
          <View style={styles.emptyGarageCard}>
            <Ionicons color={colors.text.muted} name="bicycle-outline" size={20} />
            <Text style={styles.emptyGarageText}>
              Cadastre sua moto para estimar o gasto de combustível.
            </Text>
            <Button
              size="sm"
              style={styles.emptyGarageButton}
              onPress={() => {
                trackRoutesEvent("garage_cta_clicked");
                router.push(GARAGE_ROUTE);
              }}
            >
              Ir para a Garagem
            </Button>
          </View>
        )}

        {stops.length > 0 ? (
          <View style={styles.stopsList}>
            {stops.map((stop, index) => (
              <View key={`${stop.placeId}-${index}`} style={styles.stopRow}>
                <View style={styles.stopBadge}>
                  <Text style={styles.stopBadgeText}>{index + 1}</Text>
                </View>
                <Text numberOfLines={1} style={styles.stopLabel}>
                  {stop.mainText || stop.description}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {showStopSearch ? (
          <View style={styles.stopSearch}>
            <PlaceAutocompleteField
              compact
              placeholder="Buscar parada"
              value={pendingStop}
              onChange={handleStopChange}
            />
          </View>
        ) : null}

        <RouteCoverPicker
          compact
          coverImageUri={coverImageUri}
          thumbnailType={thumbnailType}
          onCoverImageChange={onCoverImageChange}
          onRemoveCover={onRemoveCover}
          onThumbnailTypeChange={onThumbnailTypeChange}
        />

        <Button
          disabled={!canStart || isPersisting}
          size="lg"
          style={styles.startButton}
          onPress={onStartRoute}
        >
          <Ionicons color={colors.brandDark} name="navigate" size={17} />
          {isPersisting ? "Salvando..." : "Iniciar"}
        </Button>

        <View style={styles.secondaryActions}>
          <Button
            disabled={isPersisting}
            size="default"
            style={styles.secondaryButton}
            variant="secondary"
            onPress={() => setShowStopSearch((current) => !current)}
          >
            <MaterialCommunityIcons
              color={colors.brandDark}
              name="map-marker-plus-outline"
              size={16}
            />
            Adicionar parada
          </Button>

          <Button
            disabled={isPersisting}
            size="default"
            style={styles.secondaryButton}
            variant="secondary"
            onPress={handleSave}
          >
            <MaterialCommunityIcons
              color={colors.brandDark}
              name="bookmark-outline"
              size={16}
            />
            {isPersisting ? "Salvando..." : "Salvar"}
          </Button>
        </View>

        <Pressable
          accessibilityRole="button"
          style={[styles.planCard, suggestPlanner && styles.planCardHighlighted]}
          onPress={onPlanRoute}
        >
          <View style={styles.planIconWrap}>
            <MaterialCommunityIcons color={colors.brandPrimary} name="calendar-range" size={16} />
          </View>
          <View style={styles.planCopy}>
            <Text style={styles.planTitle}>Planejar este roteiro</Text>
            <Text style={styles.planSubtitle}>
              {suggestPlanner
                ? "Este trajeto já tem várias paradas — organize por dias"
                : "Adicione dias, pernoites e preferências"}
            </Text>
          </View>
          <Ionicons color={colors.border.default} name="chevron-forward" size={16} />
        </Pressable>
      </ScrollView>

      <RouteBikePickerSheet
        bikes={bikes}
        initialBikeId={selectedBikeId}
        isLoading={isLoadingBikes}
        visible={showBikePicker}
        onClose={() => setShowBikePicker(false)}
        onConfirm={(bike) => {
          onSelectBike(bike.id);
          setShowBikePicker(false);
        }}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  container: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    gap: 12,
    paddingBottom: 8,
  },
  destination: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  emptyGarageButton: {
    marginTop: 12,
  },
  emptyGarageCard: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyGarageText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  errorText: {
    color: colors.feedback.dangerStrong,
    fontSize: 13,
    fontWeight: "600",
  },
  fuelBikeCard: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  fuelBikeCopy: {
    flex: 1,
    minWidth: 0,
  },
  fuelBikeLoading: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  fuelBikeLoadingText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  fuelBikeMeta: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  fuelIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(87, 109, 30, 0.08)",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  fuelValue: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  fuelValueMuted: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "500",
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  planCard: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  planCardHighlighted: {
    backgroundColor: "rgba(200, 247, 99, 0.12)",
    borderColor: colors.brandGreen,
  },
  planCopy: {
    flex: 1,
    minWidth: 0,
  },
  planIconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  planSubtitle: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  planTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    gap: 6,
    paddingHorizontal: 12,
  },
  startButton: {
    width: "100%",
  },
  statsCard: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  statsColumn: {
    flex: 1,
  },
  statsDivider: {
    backgroundColor: colors.border.subtle,
    height: 32,
    width: 1,
  },
  statsSub: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  statsValue: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  stopBadge: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderRadius: 999,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  stopBadgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "800",
  },
  stopLabel: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  stopRow: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stopSearch: {
    marginTop: 0,
  },
  stopsList: {
    gap: 6,
  },
});
