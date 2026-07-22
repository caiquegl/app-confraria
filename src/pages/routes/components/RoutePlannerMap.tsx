import { memo, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "@/theme/colors";

import type { MapMarkerPoint } from "../types/route-create.types";
import { SHEET_HEIGHT_RATIO } from "../utils/route-day.utils";
import { ROUTE_PLANNER_MAP_STYLE } from "../utils/route-map-style";
import { RouteMapMarker } from "./RouteMapMarker";

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type AlternativeRoute = {
  coordinates: RouteCoordinate[];
  id: string;
  label: string;
};

type RoutePlannerMapProps = {
  alternativeRoutes: AlternativeRoute[];
  isRecalculating?: boolean;
  markers: MapMarkerPoint[];
  onSelectRouteOption: (optionId: string) => void;
  selectedCoordinates: RouteCoordinate[];
  userLocation?: { latitude: number; longitude: number } | null;
};

type RoutePlannerMapCanvasProps = {
  alternativeRoutes: AlternativeRoute[];
  markers: MapMarkerPoint[];
  onSelectRouteOption: (optionId: string) => void;
  selectedCoordinates: RouteCoordinate[];
  userLocation?: { latitude: number; longitude: number } | null;
};

/** Edge padding only for fitToCoordinates — not MapView.mapPadding (that shifts camera on layout). */
const MAP_FIT_BOTTOM_PADDING = 48 + SHEET_HEIGHT_RATIO.normal * 420;

function roundCoord(value: number, digits = 5): string {
  return value.toFixed(digits);
}

/** Cheap signature of map geometry — ignores sheet size / parent re-renders. */
function buildMapFitSignature(
  userLocation: { latitude: number; longitude: number } | null | undefined,
  markers: MapMarkerPoint[],
  selectedCoordinates: RouteCoordinate[],
): string {
  const userKey = userLocation
    ? `${roundCoord(userLocation.latitude)},${roundCoord(userLocation.longitude)}`
    : "";

  const markersKey = markers
    .map(
      (marker) =>
        `${marker.id}:${roundCoord(marker.coordinate.latitude)},${roundCoord(marker.coordinate.longitude)}`,
    )
    .join("|");

  const poly = selectedCoordinates;
  let polyKey = String(poly.length);

  if (poly.length > 0) {
    const first = poly[0];
    const mid = poly[Math.floor(poly.length / 2)];
    const last = poly[poly.length - 1];
    polyKey += `:${roundCoord(first.latitude, 4)},${roundCoord(first.longitude, 4)}`;
    polyKey += `:${roundCoord(mid.latitude, 4)},${roundCoord(mid.longitude, 4)}`;
    polyKey += `:${roundCoord(last.latitude, 4)},${roundCoord(last.longitude, 4)}`;
  }

  return `${userKey}::${markersKey}::${polyKey}`;
}

function areCanvasPropsEqual(
  prev: RoutePlannerMapCanvasProps,
  next: RoutePlannerMapCanvasProps,
): boolean {
  return (
    prev.onSelectRouteOption === next.onSelectRouteOption &&
    prev.userLocation === next.userLocation &&
    prev.markers === next.markers &&
    prev.selectedCoordinates === next.selectedCoordinates &&
    prev.alternativeRoutes === next.alternativeRoutes
  );
}

const RoutePlannerMapCanvas = memo(function RoutePlannerMapCanvas({
  alternativeRoutes,
  markers,
  onSelectRouteOption,
  selectedCoordinates,
  userLocation,
}: RoutePlannerMapCanvasProps) {
  const mapRef = useRef<MapView | null>(null);
  const lastFitSignatureRef = useRef<string | null>(null);

  const fitSignature = useMemo(
    () => buildMapFitSignature(userLocation, markers, selectedCoordinates),
    [markers, selectedCoordinates, userLocation],
  );

  useEffect(() => {
    if (fitSignature === lastFitSignatureRef.current) {
      return;
    }

    const coordinates = [
      ...(userLocation ? [userLocation] : []),
      ...markers.map((marker) => marker.coordinate),
      ...selectedCoordinates,
    ];

    if (coordinates.length === 0 || !mapRef.current) return;

    lastFitSignatureRef.current = fitSignature;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        bottom: MAP_FIT_BOTTOM_PADDING,
        left: 48,
        right: 48,
        top: 120,
      },
      animated: true,
    });
  }, [fitSignature, markers, selectedCoordinates, userLocation]);

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : {
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };

  return (
    <MapView
      ref={mapRef}
      customMapStyle={ROUTE_PLANNER_MAP_STYLE}
      initialRegion={initialRegion}
      provider={PROVIDER_GOOGLE}
      rotateEnabled={false}
      showsBuildings={false}
      showsCompass={false}
      showsIndoors={false}
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      showsTraffic={false}
      showsUserLocation={Boolean(userLocation)}
      style={styles.map}
      toolbarEnabled={false}
      pitchEnabled={false}
    >
      {alternativeRoutes.map((route) => (
        <Polyline
          key={route.id}
          coordinates={route.coordinates}
          lineCap="round"
          lineJoin="round"
          strokeColor="rgba(87, 117, 200, 0.35)"
          strokeWidth={4}
          tappable
          zIndex={1}
          onPress={() => onSelectRouteOption(route.id)}
        />
      ))}

      {selectedCoordinates.length > 1 ? (
        <Polyline
          coordinates={selectedCoordinates}
          lineCap="round"
          lineJoin="round"
          strokeColor={colors.brandGreen}
          strokeWidth={5}
          zIndex={2}
        />
      ) : null}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          accessibilityLabel={marker.title}
          anchor={{ x: 0.5, y: 0.5 }}
          centerOffset={{ x: 0, y: 0 }}
          coordinate={marker.coordinate}
          tracksViewChanges={false}
        >
          <RouteMapMarker marker={marker} />
        </Marker>
      ))}
    </MapView>
  );
}, areCanvasPropsEqual);

function RoutePlannerMapComponent({
  alternativeRoutes,
  isRecalculating = false,
  markers,
  onSelectRouteOption,
  selectedCoordinates,
  userLocation,
}: RoutePlannerMapProps) {
  return (
    <View style={styles.container}>
      <RoutePlannerMapCanvas
        alternativeRoutes={alternativeRoutes}
        markers={markers}
        selectedCoordinates={selectedCoordinates}
        userLocation={userLocation}
        onSelectRouteOption={onSelectRouteOption}
      />

      {isRecalculating ? (
        <View pointerEvents="none" style={styles.recalculatingBadge}>
          <ActivityIndicator color={colors.brandDark} size="small" />
          <Text style={styles.recalculatingBadgeText}>Atualizando mapa...</Text>
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.vignette} />
    </View>
  );
}

export const RoutePlannerMap = memo(RoutePlannerMapComponent);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#EEF1E8",
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  recalculatingBadge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    top: 72,
    zIndex: 2,
  },
  recalculatingBadgeText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(238, 241, 232, 0.12)",
  },
});
