import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Svg, { Path } from "react-native-svg";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { appLog } from "@/lib/app-log";
import type { RouteLiveLocation, RouteLiveReport } from "@/lib/route-navigation-socket";

import type { RouteNavigationState } from "../hooks/useRouteNavigation";
import type { RoutePhotoCluster } from "../types/route-photo.types";
import type { RouteNavigationPlacePin } from "../utils/build-navigation-place-pins";
import { RoutePhotoClusterMarker } from "./RoutePhotoClusterMarker";
import {
  CAMERA_ANIMATION_MS,
  CAMERA_TICK_MS,
  CAMERA_WATCHDOG_MS,
  CAMERA_ZOOM_ANIMATION_MS,
  DEFAULT_NAVIGATION_PITCH,
  DEFAULT_NAVIGATION_ZOOM,
  getNavigationMapPadding,
  MAP_READY_FALLBACK_MS,
  normalizeAngle,
  PITCH_CHANGE_THRESHOLD,
  pitchForSpeed,
  ZOOM_CHANGE_THRESHOLD,
  zoomForSpeed,
} from "../utils/navigation-camera.utils";
import { getRouteReportTypeByKey } from "../utils/route-report-types";
import { getRouteNavigationMapStyle } from "../utils/route-map-style";

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
    | "speedMps"
  >;
};

export function RouteNavigationMap({
  followUser,
  onPhotoClusterPress,
  onUserInteraction,
  partners = [],
  reports = [],
  photoClusters = [],
  state,
}: RouteNavigationMapProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const reportTypeByKey = useMemo(() => getRouteReportTypeByKey(colors), [colors]);
  // O estilo segue o tema escolhido no app (via tokens), não a aparência do
  // sistema: antes o app em claro com o aparelho em escuro renderizava mapa
  // noturno sob cards claros.
  const mapStyle = useMemo(() => getRouteNavigationMapStyle(colors), [colors]);
  const mapRef = useRef<MapView | null>(null);
  const zoomRef = useRef(DEFAULT_NAVIGATION_ZOOM);
  const pitchRef = useRef(DEFAULT_NAVIGATION_PITCH);
  const followUserRef = useRef(followUser);
  /** Zoom no início do gesto — para distinguir pinch/zoom de pan puro. */
  const zoomAtGestureStartRef = useRef(DEFAULT_NAVIGATION_ZOOM);
  const gestureActiveRef = useRef(false);
  const isMapReadyRef = useRef(false);
  /** A primeira posição entra sem animação para não "voar" até o usuário. */
  const hasPositionedRef = useRef(false);
  const mapHeightRef = useRef(0);
  const [mapHeight, setMapHeight] = useState(0);
  /**
   * Só o evento real do `onMapReady` libera o `mapPadding`. No Android o setter
   * da prop faz `view.map.setPadding(...)` sem checar null, e `view.map` só
   * existe depois do `onMapReady` — passar padding antes derruba o app.
   */
  const [isMapReady, setIsMapReady] = useState(false);
  /** Rumo da câmera quando o usuário gira o mapa manualmente. */
  const [mapHeading, setMapHeading] = useState(0);

  /** Espelho dos dados de navegação: o loop de câmera roda fora do ciclo de render. */
  const latestRef = useRef({
    heading: 0,
    position: null as { latitude: number; longitude: number } | null,
    speedMps: 0,
  });

  useEffect(() => {
    latestRef.current = {
      heading: Number.isFinite(state.heading) ? state.heading : 0,
      position: state.currentPosition,
      speedMps: Number.isFinite(state.speedMps) ? state.speedMps : 0,
    };
  }, [state.currentPosition, state.heading, state.speedMps]);

  // Em course-up a seta fica fixa apontando para cima e quem gira é o mapa.
  // Fora do follow ela volta a marcar o rumo real em relação à câmera.
  const userPinRotation = followUser ? 0 : normalizeAngle(state.heading - mapHeading);

  useEffect(() => {
    // Recenter: recompõe zoom e inclinação a partir da velocidade atual, em vez
    // de voltar para um nível fixo. Pinch manual não desliga o follow.
    if (followUser && !followUserRef.current) {
      const { position, speedMps } = latestRef.current;
      if (position) {
        zoomRef.current = zoomForSpeed(speedMps, position.latitude, mapHeightRef.current);
        pitchRef.current = pitchForSpeed(speedMps);
      }
    }
    followUserRef.current = followUser;
  }, [followUser]);

  useEffect(() => {
    appLog.info("route-nav:map:mount", {
      hasInitialCenter: Boolean(state.currentPosition ?? state.remainingPolyline[0]),
      remainingPoints: state.remainingPolyline.length,
    });

    // Libera apenas os comandos de câmera, que o lado nativo descarta com
    // segurança enquanto o mapa não existe. O `mapPadding` continua preso ao
    // evento real, porque lá o setter nativo desreferencia sem checar null.
    const readyFallback = setTimeout(() => {
      if (isMapReadyRef.current) return;
      isMapReadyRef.current = true;
      appLog.warn("route-nav:map:ready-timeout");
    }, MAP_READY_FALLBACK_MS);

    const cameraWatchdog = setTimeout(() => {
      if (hasPositionedRef.current) return;
      appLog.error("route-nav:map:no-camera", {
        hasPosition: Boolean(latestRef.current.position),
        isMapReady: isMapReadyRef.current,
        mapHeight: mapHeightRef.current,
      });
    }, CAMERA_WATCHDOG_MS);

    return () => {
      clearTimeout(readyFallback);
      clearTimeout(cameraWatchdog);
      appLog.info("route-nav:map:unmount", {
        positioned: hasPositionedRef.current,
        ready: isMapReadyRef.current,
      });
    };
    // Diagnóstico de ciclo de vida: roda uma vez por montagem do mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!followUser) return;

    const applyCamera = () => {
      const map = mapRef.current;
      const { heading, position, speedMps } = latestRef.current;

      if (!map || !isMapReadyRef.current || !position) {
        return;
      }

      const nextZoom = zoomForSpeed(speedMps, position.latitude, mapHeightRef.current);
      const nextPitch = pitchForSpeed(speedMps);
      const zoomChanged = Math.abs(nextZoom - zoomRef.current) > ZOOM_CHANGE_THRESHOLD;

      if (zoomChanged) {
        zoomRef.current = nextZoom;
      }
      if (Math.abs(nextPitch - pitchRef.current) > PITCH_CHANGE_THRESHOLD) {
        pitchRef.current = nextPitch;
      }

      const camera = {
        center: position,
        heading,
        pitch: pitchRef.current,
        zoom: zoomRef.current,
      };

      if (!hasPositionedRef.current) {
        hasPositionedRef.current = true;
        appLog.info("route-nav:map:first-camera", {
          mapHeight: mapHeightRef.current,
          pitch: Math.round(camera.pitch),
          zoom: Number(camera.zoom.toFixed(2)),
        });
        map.setCamera(camera);
        return;
      }

      map.animateCamera(camera, {
        duration: zoomChanged ? CAMERA_ZOOM_ANIMATION_MS : CAMERA_ANIMATION_MS,
      });
    };

    applyCamera();
    const interval = setInterval(applyCamera, CAMERA_TICK_MS);
    return () => clearInterval(interval);
  }, [followUser, isMapReady, mapHeight]);

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
      if (typeof camera.heading === "number" && !followUserRef.current) {
        setMapHeading(camera.heading);
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

  const initialCenter = state.currentPosition ?? state.remainingPolyline[0];
  const initialCamera = initialCenter
    ? {
        center: initialCenter,
        heading: 0,
        pitch: DEFAULT_NAVIGATION_PITCH,
        zoom: DEFAULT_NAVIGATION_ZOOM,
      }
    : undefined;
  // Objeto estável: trocar a referência a cada render reaplica o padding nativo.
  // Enquanto o mapa não estiver pronto a prop é omitida por completo — passar
  // `undefined` não adianta, porque o setter nativo roda do mesmo jeito.
  const mapPaddingProps = useMemo(
    () =>
      isMapReady && mapHeight > 0 ? { mapPadding: getNavigationMapPadding(mapHeight) } : {},
    [isMapReady, mapHeight],
  );

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        if (mapHeightRef.current === 0) {
          appLog.info("route-nav:map:layout", { height: Math.round(height) });
        }
        mapHeightRef.current = height;
        setMapHeight(height);
      }}
    >
      <MapView
        ref={mapRef}
        {...mapPaddingProps}
        customMapStyle={mapStyle}
        initialCamera={initialCamera}
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
        onMapReady={() => {
          const wasReady = isMapReadyRef.current;
          isMapReadyRef.current = true;
          setIsMapReady(true);
          appLog.info("route-nav:map:ready", {
            afterFallback: wasReady,
            hasPosition: Boolean(latestRef.current.position),
          });
        }}
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
            strokeColor={colors.map.navigationPolylineCompleted}
            strokeWidth={6}
          />
        ) : null}

        {state.remainingPolyline.length > 1 ? (
          <Polyline
            coordinates={state.remainingPolyline}
            lineCap="round"
            lineJoin="round"
            strokeColor={colors.map.navigationPolylineRoute}
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
                    <Ionicons color={colors.text.inverse} name="person" size={14} />
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
              <RoutePhotoClusterMarker photoCount={cluster.photos.length} />
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
              reportTypeByKey[
                report.type as keyof typeof reportTypeByKey
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
                    { backgroundColor: config?.color ?? colors.feedback.danger },
                  ]}
                >
                  <Ionicons
                    color={colors.text.inverse}
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
          <UserLocationMarker
            coordinate={state.currentPosition}
            rotation={userPinRotation}
          />
        ) : null}
      </MapView>
    </View>
  );
}

function UserLocationMarker({
  coordinate,
  rotation,
}: {
  coordinate: { latitude: number; longitude: number };
  rotation: number;
}) {
  const styles = useThemedStyles(createStyles);
  // O Android precisa de tracksViewChanges para rasterizar o SVG, mas mantê-lo
  // ligado reprocessa o bitmap a cada frame da câmera. `rotation` é prop nativa
  // do Marker, então basta desenhar uma vez e congelar.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      coordinate={coordinate}
      flat
      rotation={rotation}
      tracksViewChanges={tracksViewChanges}
    >
      {/*
        Um único SVG quadrado, ponta = topo do viewBox, centro = âncora.
        Evita badge circular + offset inventado (desalinha o bearing).
      */}
      <View collapsable={false} style={styles.userPinHitbox}>
        <HeadingNavArrow />
      </View>
    </Marker>
  );
}

function HeadingNavArrow() {
  const { colors } = useTheme();

  // Ponta em (24,2), centro geométrico do viewBox em (24,24) → bearing 0 = norte.
  return (
    <Svg width={44} height={44} viewBox="0 0 48 48">
      <Path
        d="M24 2 L42 42 L24 32 L6 42 Z"
        // Mesma cor do traçado da rota: lima no mapa noturno, oliva no diurno.
        fill={colors.map.navigationPolylineRoute}
        stroke={colors.text.inverse}
        strokeLinejoin="round"
        strokeWidth={2.5}
      />
    </Svg>
  );
}

function NavigationPlacePin({ pin }: { pin: RouteNavigationPlacePin }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <Ionicons color={colors.text.inverse} name="flag" size={15} />
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

const createStyles = (colors: AppColors) => ({
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
    borderColor: colors.surface.primary,
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
    backgroundColor: colors.surface.primary,
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
    backgroundColor: colors.map.navigationPinLabel,
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 4,
    maxWidth: 112,
    minHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  placePinTitleText: {
    color: colors.text.inverse,
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
    color: colors.text.inverse,
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
    backgroundColor: colors.routes.pinPolice,
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  reportPin: {
    alignItems: "center",
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    justifyContent: "center",
    shadowColor: colors.surface.video,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 34,
  },
});
