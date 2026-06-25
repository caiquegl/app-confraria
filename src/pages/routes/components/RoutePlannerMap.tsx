import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "@/theme/colors";

import type { MapMarkerPoint, SheetState } from "../types/route-create.types";
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
  markers: MapMarkerPoint[];
  onSelectRouteOption: (optionId: string) => void;
  selectedCoordinates: RouteCoordinate[];
  sheetState: SheetState;
  userLocation?: { latitude: number; longitude: number } | null;
};

export function RoutePlannerMap({
  alternativeRoutes,
  markers,
  onSelectRouteOption,
  selectedCoordinates,
  sheetState,
  userLocation,
}: RoutePlannerMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const sheetRatio = SHEET_HEIGHT_RATIO[sheetState];

  useEffect(() => {
    const coordinates = [
      ...(userLocation ? [userLocation] : []),
      ...markers.map((marker) => marker.coordinate),
      ...selectedCoordinates,
    ];

    if (coordinates.length === 0 || !mapRef.current) return;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        bottom: 48 + sheetRatio * 420,
        left: 48,
        right: 48,
        top: 120,
      },
      animated: true,
    });
  }, [markers, selectedCoordinates, sheetRatio, userLocation]);

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
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        customMapStyle={ROUTE_PLANNER_MAP_STYLE}
        initialRegion={initialRegion}
        provider={PROVIDER_GOOGLE}
        showsBuildings={false}
        showsCompass={false}
        showsIndoors={false}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        showsTraffic={false}
        showsUserLocation={Boolean(userLocation)}
        style={styles.map}
        toolbarEnabled={false}
        mapPadding={{
          bottom: sheetRatio * 320,
          left: 0,
          right: 0,
          top: 0,
        }}
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

      <View pointerEvents="none" style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#EEF1E8",
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(238, 241, 232, 0.12)",
  },
});
