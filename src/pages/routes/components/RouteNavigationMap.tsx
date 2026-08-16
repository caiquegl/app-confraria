import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/theme/colors";

import type { RouteLiveLocation, RouteLiveReport } from "@/lib/route-navigation-socket";

import type { RouteNavigationState } from "../hooks/useRouteNavigation";
import type { RoutePhotoCluster } from "../types/route-photo.types";
import type { RouteNavigationPlacePin } from "../utils/build-navigation-place-pins";
import { ROUTE_REPORT_TYPE_BY_KEY } from "../utils/route-report-types";
import {
  ROUTE_NAVIGATION_MAP_STYLE_NIGHT,
  ROUTE_PLANNER_MAP_STYLE,
} from "../utils/route-map-style";

type RouteNavigationMapProps = {
  followUser: boolean;
  onPhotoClusterPress?: (cluster: RoutePhotoCluster) => void;
  onUserInteraction: () => void;
  partners?: RouteLiveLocation[];
  reports?: RouteLiveReport[];
  photoClusters?: RoutePhotoCluster[];
  state: Pick<
    RouteNavigationState,
    | "completedPolyline"
    | "currentPosition"
    | "heading"
    | "placePins"
    | "remainingPolyline"
  >;
};

/** Course-up: mapa e seta seguem o heading do aparelho. */
const NAVIGATION_PITCH = 0;
const NAVIGATION_ZOOM = 17.5;

export function RouteNavigationMap({
  followUser,
  onPhotoClusterPress,
  onUserInteraction,
  partners = [],
  reports = [],
  photoClusters = [],
  state,
}: RouteNavigationMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const zoomRef = useRef(NAVIGATION_ZOOM);
  const followUserRef = useRef(followUser);
  /** Zoom no início do gesto — para distinguir pinch/zoom de pan puro. */
  const zoomAtGestureStartRef = useRef(NAVIGATION_ZOOM);
  const gestureActiveRef = useRef(false);
  const colorScheme = useColorScheme();
  const isNightMode = colorScheme === "dark";
  // Android congela o Marker cedo demais com tracksViewChanges=false e o ícone some.
  // Mantém true no pin do usuário para a seta acompanhar o heading em tempo real.
  const [tracksUserPin, setTracksUserPin] = useState(true);
  const hasUserPosition = Boolean(state.currentPosition);
  const lastTrackedHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasUserPosition) {
      setTracksUserPin(true);
      lastTrackedHeadingRef.current = null;
      return;
    }

    const heading = Number.isFinite(state.heading) ? Math.round(state.heading) : 0;
    const headingChanged =
      lastTrackedHeadingRef.current == null ||
      Math.abs(heading - lastTrackedHeadingRef.current) >= 2;

    if (!headingChanged && lastTrackedHeadingRef.current != null) {
      return;
    }

    lastTrackedHeadingRef.current = heading;
    setTracksUserPin(true);
    const timer = setTimeout(() => setTracksUserPin(false), 350);
    return () => clearTimeout(timer);
  }, [hasUserPosition, state.heading]);

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

    const heading = Number.isFinite(state.heading) ? state.heading : 0;

    mapRef.current.animateCamera(
      {
        center: state.currentPosition,
        heading,
        pitch: NAVIGATION_PITCH,
        zoom: zoomRef.current,
      },
      { duration: 280 },
    );
  }, [followUser, state.currentPosition, state.heading]);

  const handlePanDrag = () => {
    // No Android o pinch também dispara onPanDrag. Só marcamos o gesto;
    // a decisão de sair do follow é no onRegionChangeComplete (zoom vs pan).
    if (!gestureActiveRef.current) {
      gestureActiveRef.current = true;
      zoomAtGestureStartRef.current = zoomRef.current;
    }
  };

  const handleRegionChangeComplete = async () => {
    if (!mapRef.current) return;

    try {
      const camera = await mapRef.current.getCamera();
      if (typeof camera.zoom === "number") {
        zoomRef.current = camera.zoom;
      }

      if (!gestureActiveRef.current) return;

      gestureActiveRef.current = false;
      const zoomDelta = Math.abs(
        (typeof camera.zoom === "number" ? camera.zoom : zoomRef.current) -
          zoomAtGestureStartRef.current,
      );

      // Mudou o zoom → pinch/botões: mantém follow.
      // Zoom estável → pan: sai do follow.
      if (zoomDelta < 0.08) {
        onUserInteraction();
      }
    } catch {
      gestureActiveRef.current = false;
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
        rotateEnabled={!followUser}
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
        // Pan sai do follow; pinch/zoom mantém (ver handlePanDrag / handleRegionChangeComplete).
        onPanDrag={handlePanDrag}
        onRegionChangeComplete={() => {
          void handleRegionChangeComplete();
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

        {state.placePins
          .filter(
            (pin) =>
              Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude),
          )
          .map((pin) => (
            <Marker
              key={pin.id}
              anchor={{ x: 0.5, y: 1 }}
              coordinate={{
                latitude: pin.latitude,
                longitude: pin.longitude,
              }}
              tracksViewChanges={false}
              zIndex={pin.kind === "destination" ? 4 : 3}
            >
              <View collapsable={false} style={styles.placePinHitbox}>
                <NavigationPlacePin pin={pin} />
              </View>
            </Marker>
          ))}

        {partners
          .filter(
            (partner) =>
              Number.isFinite(partner.latitude) &&
              Number.isFinite(partner.longitude),
          )
          .map((partner) => {
            const partnerLabel =
              partner.name?.trim().split(/\s+/)[0] || "Motociclista";

            return (
              <Marker
                key={partner.userId}
                anchor={{ x: 0.5, y: 0.5 }}
                coordinate={{
                  latitude: partner.latitude,
                  longitude: partner.longitude,
                }}
                tracksViewChanges={false}
                rotation={
                  Number.isFinite(partner.heading) ? partner.heading : 0
                }
              >
                <View collapsable={false} style={styles.partnerPin}>
                  <View collapsable={false} style={styles.partnerPinInner}>
                    <Ionicons color="#FFFFFF" name="person" size={14} />
                  </View>
                  <View collapsable={false} style={styles.partnerLabel}>
                    <Text numberOfLines={1} style={styles.partnerLabelText}>
                      {partnerLabel}
                    </Text>
                  </View>
                </View>
              </Marker>
            );
          })}

        {photoClusters
          .filter(
            (cluster) =>
              Number.isFinite(cluster.latitude) &&
              Number.isFinite(cluster.longitude),
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
              onPress={() => onPhotoClusterPress?.(cluster)}
            >
              <View collapsable={false} style={styles.cameraPin}>
                <Ionicons color="#FFFFFF" name="camera" size={16} />
                {cluster.photos.length > 1 ? (
                  <View style={styles.cameraPinBadge}>
                    <Text style={styles.cameraPinBadgeText}>
                      {cluster.photos.length}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Marker>
          ))}

        {reports
          .filter(
            (report) =>
              Number.isFinite(report.latitude) &&
              Number.isFinite(report.longitude),
          )
          .map((report) => {
            const config =
              ROUTE_REPORT_TYPE_BY_KEY[
                report.type as keyof typeof ROUTE_REPORT_TYPE_BY_KEY
              ];
            return (
              <Marker
                key={report.id}
                anchor={{ x: 0.5, y: 1 }}
                coordinate={{
                  latitude: report.latitude,
                  longitude: report.longitude,
                }}
                tracksViewChanges={false}
              >
                <View
                  collapsable={false}
                  style={[
                    styles.reportPin,
                    { backgroundColor: config?.color ?? "#EF4444" },
                  ]}
                >
                  <Ionicons
                    color="#FFFFFF"
                    name={config?.icon ?? "alert-circle"}
                    size={16}
                  />
                </View>
              </Marker>
            );
          })}

        {state.currentPosition &&
        Number.isFinite(state.currentPosition.latitude) &&
        Number.isFinite(state.currentPosition.longitude) ? (
          <Marker
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={state.currentPosition}
            flat
            tracksViewChanges={tracksUserPin}
            rotation={Number.isFinite(state.heading) ? state.heading : 0}
          >
            {/*
              Um único SVG quadrado, ponta = topo do viewBox, centro = âncora.
              Evita badge circular + offset inventado (desalinha o bearing).
            */}
            <View collapsable={false} style={styles.userPinHitbox}>
              <HeadingNavArrow />
            </View>
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

function HeadingNavArrow() {
  // Ponta em (24,2), centro geométrico do viewBox em (24,24) → bearing 0 = norte.
  return (
    <Svg width={44} height={44} viewBox="0 0 48 48">
      <Path
        d="M24 2 L42 42 L24 32 L6 42 Z"
        fill={colors.brandGreen}
        stroke="#FFFFFF"
        strokeLinejoin="round"
        strokeWidth={2.5}
      />
    </Svg>
  );
}

function NavigationPlacePin({ pin }: { pin: RouteNavigationPlacePin }) {
  const isDestination = pin.kind === "destination";
  const title = isDestination
    ? pin.title || "Destino"
    : pin.title || `Parada ${pin.pinLabel}`;

  return (
    <View collapsable={false} style={styles.placePinWrap}>
      <View collapsable={false} style={styles.placePinTitle}>
        <Text numberOfLines={1} style={styles.placePinTitleText}>
          {title}
        </Text>
      </View>

      <View
        collapsable={false}
        style={[
          styles.placePin,
          isDestination ? styles.placePinDestination : styles.placePinStop,
        ]}
      >
        {isDestination ? (
          <Ionicons color="#FFFFFF" name="flag" size={15} />
        ) : (
          <Text style={styles.placePinLabel}>{pin.pinLabel}</Text>
        )}
      </View>

      <View
        style={[
          styles.placePinTip,
          isDestination ? styles.placePinTipDestination : styles.placePinTipStop,
        ]}
      />
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
  // Área fixa para o Android não cortar o bitmap do Marker customizado.
  placePinHitbox: {
    alignItems: "center",
    height: 78,
    justifyContent: "flex-end",
    width: 120,
  },
  placePin: {
    alignItems: "center",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  placePinDestination: {
    backgroundColor: colors.brandDark,
    height: 34,
    width: 34,
  },
  placePinLabel: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800",
    includeFontPadding: false,
    textAlign: "center",
  },
  placePinStop: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.brandGreen,
  },
  placePinTip: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderLeftColor: "transparent",
    borderLeftWidth: 6,
    borderRightColor: "transparent",
    borderRightWidth: 6,
    borderStyle: "solid",
    borderTopWidth: 8,
    height: 0,
    marginTop: -1,
    width: 0,
  },
  placePinTipDestination: {
    borderTopColor: colors.brandDark,
  },
  placePinTipStop: {
    borderTopColor: colors.brandGreen,
  },
  placePinTitle: {
    alignItems: "center",
    backgroundColor: "rgba(28, 33, 38, 0.92)",
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 4,
    maxWidth: 112,
    minHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  placePinTitleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    includeFontPadding: false,
    textAlign: "center",
  },
  placePinWrap: {
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "visible",
  },
  userPinHitbox: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  partnerLabel: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 4,
    maxWidth: 72,
    minHeight: 18,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  partnerLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    includeFontPadding: false,
    textAlign: "center",
  },
  partnerPin: {
    alignItems: "center",
    height: 58,
    justifyContent: "flex-start",
    width: 80,
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
reportPin: {
    alignItems: "center",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    overflow: "visible",
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
