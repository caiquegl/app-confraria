import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "@/theme/colors";

import type { RouteLiveLocation } from "@/lib/route-navigation-socket";

import type { RouteNavigationState } from "../hooks/useRouteNavigation";
import {
  ROUTE_NAVIGATION_MAP_STYLE_NIGHT,
  ROUTE_PLANNER_MAP_STYLE,
} from "../utils/route-map-style";

type RouteNavigationMapProps = {
  followUser: boolean;
  onUserInteraction: () => void;
  partners?: RouteLiveLocation[];
  state: Pick<
    RouteNavigationState,
    "completedPolyline" | "currentPosition" | "heading" | "remainingPolyline"
  >;
};

const NAVIGATION_PITCH = 58;
const NAVIGATION_ZOOM = 17.5;

export function RouteNavigationMap({
  followUser,
  onUserInteraction,
  partners = [],
  state,
}: RouteNavigationMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const colorScheme = useColorScheme();
  const isNightMode = colorScheme === "dark";

  useEffect(() => {
    if (!followUser || !state.currentPosition || !mapRef.current) return;

    mapRef.current.animateCamera(
      {
        center: state.currentPosition,
        heading: state.heading,
        pitch: NAVIGATION_PITCH,
        zoom: NAVIGATION_ZOOM,
      },
      { duration: 500 },
    );
  }, [followUser, state.currentPosition, state.heading]);

  const initialRegion = state.currentPosition
    ? {
        latitude: state.currentPosition.latitude,
        longitude: state.currentPosition.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : state.remainingPolyline[0]
      ? {
          latitude: state.remainingPolyline[0].latitude,
          longitude: state.remainingPolyline[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        customMapStyle={isNightMode ? ROUTE_NAVIGATION_MAP_STYLE_NIGHT : ROUTE_PLANNER_MAP_STYLE}
        initialRegion={initialRegion}
        pitchEnabled={false}
        provider={PROVIDER_GOOGLE}
        rotateEnabled={false}
        scrollEnabled={false}
        showsBuildings
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        showsTraffic={false}
        showsUserLocation={false}
        style={styles.map}
        toolbarEnabled={false}
        zoomEnabled={false}
        onPanDrag={onUserInteraction}
      >
        {state.completedPolyline.length > 1 ? (
          <Polyline
            coordinates={state.completedPolyline}
            lineCap="round"
            lineJoin="round"
            strokeColor="rgba(28, 33, 38, 0.35)"
            strokeWidth={6}
          />
        ) : null}

        {state.remainingPolyline.length > 1 ? (
          <Polyline
            coordinates={state.remainingPolyline}
            lineCap="round"
            lineJoin="round"
            strokeColor={colors.brandGreen}
            strokeWidth={7}
          />
        ) : null}

        {partners.map((partner) => (
          <Marker
            key={partner.userId}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={{
              latitude: partner.latitude,
              longitude: partner.longitude,
            }}
            rotation={partner.heading}
          >
            <View style={styles.partnerPin}>
              <View style={styles.partnerPinInner}>
                <Ionicons color="#FFFFFF" name="person" size={14} />
              </View>
              <Text numberOfLines={1} style={styles.partnerLabel}>
                {partner.name.split(" ")[0]}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {state.currentPosition ? (
        <View
          pointerEvents="none"
          style={[
            styles.puck,
            {
              transform: [{ rotate: `${state.heading}deg` }],
            },
          ]}
        >
          <View style={styles.puckInner}>
            <Ionicons color={colors.brandGreen} name="navigate" size={20} />
          </View>
        </View>
      ) : null}
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
  puck: {
    alignItems: "center",
    justifyContent: "center",
    left: "50%",
    marginLeft: -24,
    marginTop: -24,
    position: "absolute",
    top: "58%",
  },
  puckInner: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 3,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  partnerLabel: {
    backgroundColor: colors.brandDark,
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    maxWidth: 72,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: "center",
  },
  partnerPin: {
    alignItems: "center",
  },
  partnerPinInner: {
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
});
