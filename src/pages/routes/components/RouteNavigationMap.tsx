import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "@/theme/colors";

import type { RouteLiveLocation } from "@/lib/route-navigation-socket";

import type { RouteNavigationState } from "../hooks/useRouteNavigation";
import type { RoutePhotoCluster } from "../types/route-photo.types";
import {
  ROUTE_NAVIGATION_MAP_STYLE_NIGHT,
  ROUTE_PLANNER_MAP_STYLE,
} from "../utils/route-map-style";

type RouteNavigationMapProps = {
  followUser: boolean;
  onPhotoClusterPress?: (cluster: RoutePhotoCluster) => void;
  onUserInteraction: () => void;
  partners?: RouteLiveLocation[];
  photoClusters?: RoutePhotoCluster[];
  state: Pick<
    RouteNavigationState,
    "completedPolyline" | "currentPosition" | "heading" | "remainingPolyline"
  >;
};

const NAVIGATION_PITCH = 58;
const NAVIGATION_ZOOM = 17.5;

export function RouteNavigationMap({
  followUser,
  onPhotoClusterPress,
  onUserInteraction,
  partners = [],
  photoClusters = [],
  state,
}: RouteNavigationMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const zoomRef = useRef(NAVIGATION_ZOOM);
  const followUserRef = useRef(followUser);
  const colorScheme = useColorScheme();
  const isNightMode = colorScheme === "dark";

  useEffect(() => {
    // Recenter: volta ao zoom padrão da navegação.
    // Zoom manual (pinch) não deve desligar o follow nem resetar o nível.
    if (followUser && !followUserRef.current) {
      zoomRef.current = NAVIGATION_ZOOM;
    }
    followUserRef.current = followUser;
  }, [followUser]);

  useEffect(() => {
    if (!followUser || !state.currentPosition || !mapRef.current) return;

    mapRef.current.animateCamera(
      {
        center: state.currentPosition,
        heading: state.heading,
        pitch: NAVIGATION_PITCH,
        zoom: zoomRef.current,
      },
      { duration: 500 },
    );
  }, [followUser, state.currentPosition, state.heading]);

  const persistCameraZoom = async () => {
    if (!mapRef.current) return;

    try {
      const camera = await mapRef.current.getCamera();
      if (typeof camera.zoom === "number") {
        zoomRef.current = camera.zoom;
      }
    } catch {
      // ignore camera read failures
    }
  };

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
        pitchEnabled={followUser}
        provider={PROVIDER_GOOGLE}
        rotateEnabled={false}
        scrollEnabled
        showsBuildings
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        showsTraffic={false}
        showsUserLocation={false}
        style={styles.map}
        toolbarEnabled={false}
        zoomControlEnabled
        zoomEnabled
        // Só pan/arraste sai do follow. Pinch/zoom mantém o foco no usuário.
        onPanDrag={onUserInteraction}
        onRegionChangeComplete={() => {
          void persistCameraZoom();
        }}
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

        {photoClusters.map((cluster) => (
          <Marker
            key={cluster.id}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={{
              latitude: cluster.latitude,
              longitude: cluster.longitude,
            }}
            onPress={() => onPhotoClusterPress?.(cluster)}
          >
            <View style={styles.cameraPin}>
              <Ionicons color="#FFFFFF" name="camera" size={16} />
              {cluster.photos.length > 1 ? (
                <View style={styles.cameraPinBadge}>
                  <Text style={styles.cameraPinBadgeText}>{cluster.photos.length}</Text>
                </View>
              ) : null}
            </View>
          </Marker>
        ))}

        {state.currentPosition ? (
          <Marker
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={state.currentPosition}
            flat
            rotation={followUser ? 0 : state.heading}
          >
            <View style={styles.userPin}>
              <MaterialCommunityIcons
                color={colors.brandGreen}
                name="motorbike"
                size={22}
                style={styles.userPinIcon}
              />
            </View>
          </Marker>
        ) : null}
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
  userPin: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 3,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  userPinIcon: {
    // motorbike aponta para a direita; -90° alinha o nariz com a direção da câmera/heading
    transform: [{ rotate: "-90deg" }],
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
  cameraPin: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderColor: colors.brandGreen,
    borderRadius: 999,
    borderWidth: 2,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  cameraPinBadge: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: -6,
    top: -6,
  },
  cameraPinBadgeText: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: "800",
  },
});
