import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "@/theme/colors";

import type { MapMarkerPoint } from "../types/route-create.types";
import { ROUTE_PLANNER_MAP_STYLE } from "../utils/route-map-style";
import { RouteMapMarker } from "./RouteMapMarker";

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type RouteDetailMapProps = {
  markers: MapMarkerPoint[];
  routeCoordinates: RouteCoordinate[];
};

const MAP_EDGE_PADDING = {
  bottom: 48,
  left: 48,
  right: 48,
  top: 48,
};

function buildFitCoordinates(
  routeCoordinates: RouteCoordinate[],
  markers: MapMarkerPoint[],
): RouteCoordinate[] {
  if (routeCoordinates.length > 1) {
    return routeCoordinates;
  }

  return markers.map((marker) => marker.coordinate);
}

export function RouteDetailMap({ markers, routeCoordinates }: RouteDetailMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const fitCoordinates = useMemo(
    () => buildFitCoordinates(routeCoordinates, markers),
    [markers, routeCoordinates],
  );

  const initialRegion = useMemo(() => {
    const first = fitCoordinates[0];
    if (!first) {
      return {
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };
    }

    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [fitCoordinates]);

  const fitMapToRoute = useCallback(() => {
    if (fitCoordinates.length === 0 || !mapRef.current) return;

    mapRef.current.fitToCoordinates(fitCoordinates, {
      animated: false,
      edgePadding: MAP_EDGE_PADDING,
    });
  }, [fitCoordinates]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      fitMapToRoute();
    });

    return () => cancelAnimationFrame(frame);
  }, [fitMapToRoute]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        customMapStyle={ROUTE_PLANNER_MAP_STYLE}
        initialRegion={initialRegion}
        provider={PROVIDER_GOOGLE}
        rotateEnabled={false}
        scrollEnabled={false}
        showsBuildings={false}
        showsCompass={false}
        showsIndoors={false}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        showsTraffic={false}
        showsUserLocation={false}
        pitchEnabled={false}
        style={styles.map}
        toolbarEnabled={false}
        zoomEnabled={false}
        onLayout={fitMapToRoute}
      >
        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            lineCap="round"
            lineJoin="round"
            strokeColor={colors.brandGreen}
            strokeWidth={4}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
});
