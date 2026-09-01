import { Ionicons } from "@expo/vector-icons";
import { router, type Href, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type LongPressEvent,
  type Region,
} from "react-native-maps";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";

import { PlaceAutocompleteField } from "@/components/PlaceAutocompleteField";
import { UserAvatar } from "@/components/UserAvatar";
import {
  getStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { fetchFuelCostEstimate } from "@/lib/places";
import { useGeolocation } from "@/lib/location";
import { formatMapPointLabel } from "@/lib/location/format-location-label";
import type { PlaceReference } from "@/lib/places";
import { resolvePlaceWithCoords } from "@/lib/places";
import { ensureRouteBackgroundTracking } from "@/lib/route-background-tracking";
import { getApiErrorMessage } from "@/lib/password-reset";
import { fetchMapGasStations, fetchNearbyPlaces } from "@/pages/services/services/nearby.service";
import type { NearbyPlace } from "@/pages/services/types/services.types";
import { useNotificationBadge } from "@/pages/notifications";
import { fetchSubscriptionMe } from "@/pages/subscription/services/subscription.service";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { QuickRouteSheet } from "../components/QuickRouteSheet";
import { FreeRouteLimitPaywall } from "../components/FreeRouteLimitPaywall";
import { RouteMapPhotosCarouselModal } from "../components/RouteMapPhotosCarouselModal";
import { RoutePhotoClusterMarker } from "../components/RoutePhotoClusterMarker";
import {
  DestinationMapPin,
  NearbyPartnerPin,
  StopMapPin,
} from "../components/RoutesMapPins";
import {
  getRoutesSheetDetentHeight,
  RoutesHomeBottomSheet,
  type RoutesSheetDetent,
} from "../components/RoutesHomeBottomSheet";
import {
  RoutesNearbySheetContent,
  type NearbyCategoryFilter,
} from "../components/RoutesNearbySheetContent";
import { useMyRoutes } from "../hooks/useMyRoutes";
import { useNearbyRouteMapPhotos } from "../hooks/useNearbyRouteMapPhotos";
import { useQuickRouteDirections } from "../hooks/useQuickRouteDirections";
import { useRouteBikes } from "../hooks/useRouteBikes";
import { createRoute } from "../services/routes.service";
import type { QuickRoutePlace } from "../types/quick-route.types";
import type { RouteThumbnailType } from "../types/saved-route.types";
import type { RouteStyle } from "../types/route-style";
import { buildQuickRoutePayload } from "../utils/build-quick-route-payload";
import { createDefaultRouteCover } from "../types/route-create.types";
import { isFreeRouteLimitError, isPremiumRouteStyleError } from "../utils/free-route-limit.utils";
import {
  dedupeNearbyPlaces,
  sortNearbyPlacesByPriority,
} from "../utils/nearby-places.utils";
import { saveQuickRoutePlannerSnapshot } from "../utils/quick-route-planner.storage";
import { getRoutePlannerMapStyle } from "../utils/route-map-style";
import { trackRoutesEvent } from "../utils/track-routes-event";

const FALLBACK_REGION: Region = {
  latitude: -23.5225,
  longitude: -46.1857,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const NEARBY_CATEGORIES = [
  "Postos de Gasolina",
  "Mecânicas",
  "Restaurantes",
  "Hotéis",
] as const;

function toQuickPlace(
  place: PlaceReference & { latitude?: number; longitude?: number },
): QuickRoutePlace | null {
  if (place.latitude == null || place.longitude == null) return null;
  return {
    ...place,
    latitude: place.latitude,
    longitude: place.longitude,
    reference: place.reference || place.placeId,
    types: place.types ?? [],
  };
}

function buildGpsPlace(
  latitude: number,
  longitude: number,
  label: string,
): QuickRoutePlace {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const placeId = `gps:${latitude}:${longitude}`;
  return {
    description: label,
    latitude,
    longitude,
    mainText: label,
    placeId,
    reference: placeId,
    secondaryText: "",
    types: [],
  };
}

export function RoutesMapHomeView() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const plannerMapStyle = useMemo(() => getRoutePlannerMapStyle(colors), [colors]);
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  const mapAreaHeightRef = useRef(0);
  const { hasUnread } = useNotificationBadge();
  const { location, refreshLocation, requestPermission } = useGeolocation();
  const { bikes, isLoading: isLoadingBikes, reloadBikes } = useRouteBikes();
  const { routes: myRoutes } = useMyRoutes();
  const storedProfile = getStoredCurrentProfile();

  const [userAvatar, setUserAvatar] = useState<string | null>(storedProfile.avatar);
  const [userName, setUserName] = useState<string>(storedProfile.name ?? "Perfil");
  const [destination, setDestination] = useState<QuickRoutePlace | null>(null);
  const [stops, setStops] = useState<QuickRoutePlace[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [fuelCost, setFuelCost] = useState<number | null>(null);
  const [isLoadingFuel, setIsLoadingFuel] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [routeCover, setRouteCover] = useState(createDefaultRouteCover);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapGasStations, setMapGasStations] = useState<NearbyPlace[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [sheetDetent, setSheetDetent] = useState<RoutesSheetDetent>("collapsed");
  const [nearbyCategory, setNearbyCategory] = useState<NearbyCategoryFilter>("all");
  const [mapAreaHeight, setMapAreaHeight] = useState(0);
  const [routeResetToken, setRouteResetToken] = useState(0);
  const [showFreeRoutePaywall, setShowFreeRoutePaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"limit" | "routeStyle">("limit");
  const [isPremium, setIsPremium] = useState(false);
  const [routeStyle, setRouteStyle] = useState<RouteStyle>("direct");

  const hasCoords = location.latitude != null && location.longitude != null;
  const isLocationReady = location.status === "ready" && hasCoords;
  const isLocationBlocked =
    location.status === "denied" || location.status === "error";
  const isLocationPending =
    location.status === "idle" ||
    location.status === "loading" ||
    (location.status === "ready" && !hasCoords);

  const mapPhotos = useNearbyRouteMapPhotos({
    enabled: isLocationReady,
    latitude: location.latitude,
    longitude: location.longitude,
  });

  const origin = useMemo<QuickRoutePlace | null>(() => {
    if (!hasCoords) return null;
    return buildGpsPlace(
      location.latitude!,
      location.longitude!,
      location.cityLabel ?? "Localização atual",
    );
  }, [hasCoords, location.cityLabel, location.latitude, location.longitude]);

  const directions = useQuickRouteDirections({
    destination,
    enabled: isLocationReady && destination != null,
    origin,
    resetToken: routeResetToken,
    routeStyle,
    stops,
  });

  const selectedBike = useMemo(
    () => bikes.find((bike) => bike.id === selectedBikeId) ?? bikes[0] ?? null,
    [bikes, selectedBikeId],
  );

  const recentPreview = useMemo(
    () =>
      myRoutes
        .filter((route) => route.kind === "quick")
        .slice(0, 5),
    [myRoutes],
  );

  const showQuickSheet = Boolean(destination && isLocationReady);
  const mapSheetHeight = mapAreaHeight || windowHeight * 0.55;
  const activeSheetHeight = getRoutesSheetDetentHeight(sheetDetent, mapSheetHeight);

  const mapRegion = useMemo<Region>(() => {
    if (hasCoords) {
      return {
        latitude: location.latitude!,
        longitude: location.longitude!,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };
    }
    return FALLBACK_REGION;
  }, [hasCoords, location.latitude, location.longitude]);

  useEffect(() => {
    trackRoutesEvent("routes_map_opened");
  }, []);

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setUserAvatar(profile.avatar);
      setUserName(profile.name ?? "Perfil");
    });
  }, []);

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
    if (selectedBikeId) return;

    const defaultBike = bikes.find((bike) => bike.isMainBike) ?? bikes[0];
    if (defaultBike?.id) {
      setSelectedBikeId(defaultBike.id);
    }
  }, [bikes, selectedBikeId]);

  useEffect(() => {
    if (showQuickSheet) {
      void reloadBikes();
    }
  }, [reloadBikes, showQuickSheet]);

  useEffect(() => {
    if (showQuickSheet) {
      setSheetDetent("expanded");
    } else {
      setSheetDetent("collapsed");
    }
  }, [showQuickSheet]);

  const handleSheetDetentChange = useCallback(
    (next: RoutesSheetDetent) => {
      if (showQuickSheet && next === "collapsed") {
        setSheetDetent("mid");
        return;
      }
      setSheetDetent(next);
    },
    [showQuickSheet],
  );

  useEffect(() => {
    if (!destination?.latitude || !destination.longitude) return;
    mapRef.current?.animateToRegion(
      {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
      450,
    );
  }, [destination?.latitude, destination?.longitude, destination?.placeId]);

  useEffect(() => {
    if (
      !selectedBike ||
      directions.selectedOption?.distanceMeters == null ||
      !destination
    ) {
      setFuelCost(null);
      return;
    }

    let cancelled = false;
    setIsLoadingFuel(true);

    const timer = setTimeout(() => {
      const destinationPlaceId = destination.placeId.trim();
      const canResolveStateFromPlace =
        destinationPlaceId.length > 0 &&
        !destinationPlaceId.startsWith("gps:") &&
        !destinationPlaceId.startsWith("manual:");

      void fetchFuelCostEstimate({
        baseConsumption: selectedBike.baseConsumption,
        distanceMeters: directions.selectedOption!.distanceMeters!,
        fuelType: "gasoline",
        ...(canResolveStateFromPlace ? { destinationPlaceId } : {}),
      })
        .then((estimate) => {
          if (!cancelled) {
            setFuelCost(estimate.fuelCost);
            trackRoutesEvent("fuel_estimate_viewed", { context: "quick_route_sheet" });
          }
        })
        .catch(() => {
          if (!cancelled) setFuelCost(null);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingFuel(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destination, directions.selectedOption?.distanceMeters, selectedBike]);

  useEffect(() => {
    if (!isLocationReady || destination) {
      setNearbyPlaces([]);
      return;
    }

    let cancelled = false;
    setIsLoadingNearby(true);

    void Promise.all(
      NEARBY_CATEGORIES.map((category) =>
        fetchNearbyPlaces({
          category,
          latitude: location.latitude!,
          longitude: location.longitude!,
          radius: 8000,
        }).catch(() => [] as NearbyPlace[]),
      ),
    )
      .then((groups) => {
        if (cancelled) return;
        setNearbyPlaces(
          sortNearbyPlacesByPriority(dedupeNearbyPlaces(groups.flat())),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingNearby(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination, isLocationReady, location.latitude, location.longitude]);

  useEffect(() => {
    if (!isLocationReady || destination) {
      setMapGasStations([]);
      return;
    }

    let cancelled = false;

    void fetchMapGasStations({
      latitude: location.latitude!,
      longitude: location.longitude!,
      radius: 8000,
      minRating: 4.5,
    })
      .then((places) => {
        if (!cancelled) setMapGasStations(places.slice(0, 16));
      })
      .catch(() => {
        if (!cancelled) setMapGasStations([]);
      });

    return () => {
      cancelled = true;
    };
  }, [destination, isLocationReady, location.latitude, location.longitude]);

  const handleRecenter = () => {
    if (!hasCoords) {
      void requestPermission();
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude!,
        longitude: location.longitude!,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      },
      450,
    );
    void refreshLocation();
  };

  const handleClearDestination = useCallback(() => {
    setDestination((prevDestination) => {
      setStops((prevStops) => {
        if (prevDestination != null || prevStops.length > 0) {
          setRouteResetToken((token) => token + 1);
        }
        return [];
      });
      return null;
    });
    setFuelCost(null);
    setIsLoadingFuel(false);
    setIsPersisting(false);
    setRouteCover(createDefaultRouteCover());
    setRouteStyle("direct");
    setSheetDetent("collapsed");

    if (hasCoords) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude!,
          longitude: location.longitude!,
          latitudeDelta: 0.045,
          longitudeDelta: 0.045,
        },
        450,
      );
    }
  }, [hasCoords, location.latitude, location.longitude]);

  useFocusEffect(
    useCallback(() => {
      handleClearDestination();
      void mapPhotos.reload();
    }, [handleClearDestination, mapPhotos.reload]),
  );

  const applyDestination = useCallback((place: QuickRoutePlace) => {
    setDestination(place);
    setStops([]);
    setSheetDetent("expanded");
  }, []);

  const resolveMapPointDestination = useCallback(
    async (latitude: number, longitude: number) => {
      let label = "Local selecionado no mapa";

      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        label = formatMapPointLabel(places[0]);
      } catch {
        // Mantém label genérico se o reverse geocode falhar.
      }

      applyDestination(buildGpsPlace(latitude, longitude, label));
      trackRoutesEvent("quick_route_destination_searched", { source: "map_long_press" });
    },
    [applyDestination],
  );

  const handleMapLongPress = useCallback(
    (event: LongPressEvent) => {
      if (!isLocationReady) {
        Toast.show({
          text1: "Ative a localização",
          text2: "Precisamos da sua posição para montar a rota.",
          type: "info",
        });
        return;
      }

      const { latitude, longitude } = event.nativeEvent.coordinate;
      void resolveMapPointDestination(latitude, longitude);
    },
    [isLocationReady, resolveMapPointDestination],
  );

  const handleDestinationChange = (place: PlaceReference | null) => {
    if (!place) {
      handleClearDestination();
      return;
    }

    trackRoutesEvent("quick_route_destination_searched");

    void resolvePlaceWithCoords(place)
      .then((resolved) => {
        const quickPlace = toQuickPlace(resolved);
        if (!quickPlace) {
          Toast.show({
            text1: "Destino inválido",
            text2: "Selecione um endereço com coordenadas válidas.",
            type: "error",
          });
          setDestination(null);
          return;
        }

        applyDestination(quickPlace);
      })
      .catch(() => {
        Toast.show({
          text1: "Não foi possível localizar o destino",
          type: "error",
        });
      });
  };

  const handleNearbyPress = (place: NearbyPlace) => {
    if (place.latitude == null || place.longitude == null) return;

    applyDestination(
      toQuickPlace({
        description: place.address ?? place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        mainText: place.name,
        placeId: place.googlePlaceId,
        reference: place.googlePlaceId,
        secondaryText: place.address ?? "",
        types: [],
      })!,
    );
    trackRoutesEvent("quick_route_destination_searched", { source: "nearby_partner" });
  };

  const persistQuickRoute = useCallback(
    async (action: "start_now" | "save_for_later") => {
      if (!destination) return;

      if (action === "start_now") {
        if (!origin || !selectedBike || !directions.selectedOption) return;
      } else if (!origin) {
        Toast.show({
          text1: "Localização indisponível",
          text2: "Ative a localização para salvar a rota.",
          type: "error",
        });
        return;
      } else {
        const bikeForSave =
          selectedBike ?? bikes.find((bike) => bike.isMainBike) ?? bikes[0] ?? null;

        if (!bikeForSave) {
          Toast.show({
            text1: "Cadastre uma moto",
            text2: "Você precisa de uma moto na garagem para salvar.",
            type: "error",
            onPress: () => router.push("/profile/bikes" as Href),
          });
          return;
        }
      }

      const bikeForAction =
        action === "start_now"
          ? selectedBike!
          : selectedBike ?? bikes.find((bike) => bike.isMainBike) ?? bikes[0]!;

      setIsPersisting(true);
      try {
        const payload = buildQuickRoutePayload({
          action,
          bikeId: bikeForAction.id,
          coverImageUri:
            routeCover.thumbnailType === "image" ? routeCover.coverImageUri || null : null,
          destination,
          fuelCost,
          kind: action === "start_now" ? "quick" : "planned",
          origin: origin!,
          routeStyle,
          selectedOption: directions.selectedOption,
          stops,
          thumbnailType: routeCover.thumbnailType,
        });

        const coverUri =
          routeCover.thumbnailType === "image" ? routeCover.coverImageUri || null : null;

        const route = await createRoute(payload, coverUri);

        if (action === "start_now") {
          trackRoutesEvent("quick_route_started", { routeId: route.id });
          await ensureRouteBackgroundTracking(route.id, route.title);
          router.push(`/routes/${route.id}/navigate` as Href);
        } else {
          trackRoutesEvent("quick_route_saved", { routeId: route.id });
          Toast.show({
            text1: "Rota salva",
            text2: "Encontre em Minhas rotas → Planejadas.",
            type: "success",
          });
          router.push("/routes/mine" as Href);
        }
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
          text1: action === "start_now" ? "Erro ao iniciar rota" : "Erro ao salvar rota",
          text2: getApiErrorMessage(error, "Tente novamente em instantes."),
          type: "error",
        });
      } finally {
        setIsPersisting(false);
      }
    },
    [bikes, destination, directions.selectedOption, fuelCost, origin, routeCover, routeStyle, selectedBike, stops],
  );

  const handlePlanRoute = useCallback(async () => {
    if (origin && destination && directions.selectedOption) {
      await saveQuickRoutePlannerSnapshot({
        destination,
        origin,
        selectedOptionId: directions.selectedOptionId,
        selectedRoute: directions.selectedOption,
        stops,
        routeStyle,
      });
      trackRoutesEvent("quick_route_converted_to_planner");
    }

    router.push("/routes/create" as Href);
  }, [destination, directions.selectedOption, directions.selectedOptionId, origin, routeStyle, stops]);

  const locationLabel =
    location.cityLabel ??
    (isLocationReady ? "Localização atual" : "Ative a localização");

  const floatingBottom = activeSheetHeight + 12;

  const mapPartners = !destination ? mapGasStations : [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.locationRow}>
            <Ionicons color={colors.text.secondary} name="location-outline" size={14} />
            <Text numberOfLines={1} style={styles.locationText}>
              {locationLabel}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Abrir notificações"
            accessibilityRole="button"
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons color={colors.text.secondary} name="notifications-outline" size={20} />
            {hasUnread ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          {destination ? (
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.backButton}
              onPress={handleClearDestination}
            >
              <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
            </Pressable>
          ) : null}

          <View style={styles.searchFieldWrap}>
            <PlaceAutocompleteField
              compact
              editable={isLocationReady}
              placeholder="Para onde vamos?"
              suppressSuggestions={!isLocationReady}
              value={destination}
              onChange={handleDestinationChange}
            />
          </View>

          <Pressable
            accessibilityLabel="Abrir perfil"
            accessibilityRole="button"
            style={styles.avatarButton}
            onPress={() => router.push("/profile")}
          >
            <UserAvatar avatarUrl={userAvatar} name={userName} size={48} />
          </Pressable>
        </View>
      </View>

      <View
        style={styles.mapArea}
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          mapAreaHeightRef.current = nextHeight;
          setMapAreaHeight(nextHeight);
        }}
      >
        <MapView
          key={`routes-home-map-${routeResetToken}`}
          ref={mapRef}
          customMapStyle={plannerMapStyle}
          initialRegion={mapRegion}
          moveOnMarkerPress={false}
          provider={PROVIDER_GOOGLE}
          showsCompass={false}
          showsMyLocationButton={false}
          showsUserLocation={isLocationReady}
          style={StyleSheet.absoluteFill}
          onLongPress={handleMapLongPress}
        >
          {mapPartners.map((place) =>
            place.latitude != null && place.longitude != null ? (
              <Marker
                key={place.googlePlaceId}
                anchor={{ x: 0.5, y: 0.5 }}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                tracksViewChanges={false}
                onPress={() => handleNearbyPress(place)}
              >
                <NearbyPartnerPin category={place.category} />
              </Marker>
            ) : null,
          )}

          {destination ? (
            <Marker
              anchor={{ x: 0.5, y: 0.5 }}
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              tracksViewChanges={false}
            >
              <DestinationMapPin />
            </Marker>
          ) : null}

          {stops.map((stop, index) => (
            <Marker
              key={`${stop.placeId}-${index}`}
              anchor={{ x: 0.5, y: 0.5 }}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              tracksViewChanges={false}
            >
              <StopMapPin index={index} />
            </Marker>
          ))}

          {destination && directions.selectedPolyline.length > 1 ? (
            <Polyline
              key={`quick-route-${routeResetToken}-${destination.placeId}-${stops.length}-${directions.selectedOptionId}`}
              coordinates={directions.selectedPolyline}
              strokeColor={colors.brandDark}
              strokeWidth={5}
            />
          ) : null}

          {mapPhotos.clusters
            .filter(
              (cluster) =>
                Number.isFinite(cluster.latitude) && Number.isFinite(cluster.longitude),
            )
            .map((cluster) => (
              <Marker
                key={cluster.id}
                anchor={{ x: 0.5, y: 0.5 }}
                coordinate={{
                  latitude: cluster.latitude,
                  longitude: cluster.longitude,
                }}
                tracksViewChanges={false}
                onPress={() => mapPhotos.openCluster(cluster)}
              >
                <RoutePhotoClusterMarker photoCount={cluster.photos.length} />
              </Marker>
            ))}
        </MapView>

        {!showQuickSheet ? (
          <View
            pointerEvents="box-none"
            style={[styles.floatingActions, { bottom: floatingBottom }]}
          >
            <Pressable
              accessibilityLabel="Planejar roteiro"
              accessibilityRole="button"
              style={styles.planButton}
              onPress={() => void handlePlanRoute()}
            >
              <Ionicons color={colors.brandDark} name="navigate" size={16} />
              <Text style={styles.planButtonText}>Planejar roteiro</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Centralizar no mapa"
              accessibilityRole="button"
              style={styles.recenterButton}
              onPress={handleRecenter}
            >
              <Ionicons
                color={isLocationReady ? colors.brandPrimary : colors.text.muted}
                name="locate"
                size={20}
              />
            </Pressable>
          </View>
        ) : (
          <View
            pointerEvents="box-none"
            style={[styles.floatingActionsEnd, { bottom: floatingBottom }]}
          >
            <Pressable
              accessibilityLabel="Centralizar no mapa"
              accessibilityRole="button"
              style={styles.recenterButton}
              onPress={handleRecenter}
            >
              <Ionicons
                color={isLocationReady ? colors.brandPrimary : colors.text.muted}
                name="locate"
                size={20}
              />
            </Pressable>
          </View>
        )}

        <RoutesHomeBottomSheet
          containerHeight={mapSheetHeight}
          detent={sheetDetent}
          minDetent={showQuickSheet ? "mid" : undefined}
          onDetentChange={handleSheetDetentChange}
        >
          {showQuickSheet && destination ? (
            <View style={styles.quickSheetWrap}>
              <QuickRouteSheet
                bikes={bikes}
                coverImageUri={routeCover.coverImageUri}
                destination={destination}
                isLoadingBikes={isLoadingBikes}
                etaLabel={directions.etaLabel}
                fuelCost={fuelCost}
                isCalculating={directions.isLoading}
                isLoadingFuel={isLoadingFuel}
                isPersisting={isPersisting}
                isPremium={isPremium}
                routeError={directions.error}
                routeStyle={routeStyle}
                selectedBikeId={selectedBikeId}
                selectedOption={directions.selectedOption}
                stops={stops}
                thumbnailType={routeCover.thumbnailType}
                onAddStop={(place) => setStops((current) => [...current, place])}
                onCoverImageChange={(uri) =>
                  setRouteCover((current) => ({ ...current, coverImageUri: uri }))
                }
                onPlanRoute={() => void handlePlanRoute()}
                onRemoveCover={() => setRouteCover(createDefaultRouteCover())}
                onSaveRoute={() => void persistQuickRoute("save_for_later")}
                onSelectBike={setSelectedBikeId}
                onStartRoute={() => void persistQuickRoute("start_now")}
                onRequestPremium={() => {
                  setPaywallReason("routeStyle");
                  setShowFreeRoutePaywall(true);
                }}
                onSelectRouteStyle={setRouteStyle}
                onThumbnailTypeChange={(thumbnailType) =>
                  setRouteCover((current) => ({
                    ...current,
                    thumbnailType,
                    ...(thumbnailType === "map" ? { coverImageUri: "" } : {}),
                  }))
                }
              />
            </View>
          ) : (
            <RoutesNearbySheetContent
              category={nearbyCategory}
              detent={sheetDetent}
              isLoadingNearby={isLoadingNearby}
              locationBlocked={isLocationBlocked}
              locationPending={isLocationPending}
              partners={nearbyPlaces}
              recentRoutes={recentPreview}
              onCategoryChange={setNearbyCategory}
              onPartnerPress={handleNearbyPress}
              onRequestLocation={() => {
                if (location.status === "denied" && !location.canAskAgain) {
                  void Linking.openSettings();
                  return;
                }
                void requestPermission();
              }}
            />
          )}
        </RoutesHomeBottomSheet>
      </View>

      <RouteMapPhotosCarouselModal
        photos={mapPhotos.selectedCluster?.photos ?? []}
        visible={mapPhotos.selectedCluster != null}
        onClose={mapPhotos.closeCluster}
      />

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

const createStyles = (colors: AppColors) => ({
  avatarButton: {
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  floatingActions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    left: 16,
    position: "absolute",
    right: 16,
    zIndex: 15,
  },
  floatingActionsEnd: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    left: 16,
    position: "absolute",
    right: 16,
    zIndex: 15,
  },
  header: {
    backgroundColor: colors.brandGray,
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 8,
    zIndex: 30,
  },
  locationRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 4,
    minWidth: 0,
  },
  locationText: {
    color: colors.text.secondary,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  mapArea: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  notificationButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    position: "relative",
    width: 40,
  },
  planButton: {
    alignItems: "center",
    backgroundColor: colors.accent.brand,
    borderRadius: 999,
    elevation: 6,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: colors.brandGreen,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  planButtonText: {
    color: colors.text.onBrand,
    fontSize: 14,
    fontWeight: "700",
  },
  quickSheetWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recenterButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: 999,
    elevation: 6,
    height: 44,
    justifyContent: "center",
    marginLeft: "auto",
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: 44,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  searchFieldWrap: {
    flex: 1,
    minWidth: 0,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  unreadDot: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGray,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 8,
    top: 8,
    width: 10,
  },
});
