import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "@/theme/colors";
import type {
  PlaceLiveInfo,
  Service,
} from "@/pages/services/types/services.types";

type ServicePlaceInfoProps = {
  service: Service;
  liveInfo: PlaceLiveInfo | null;
};

export function ServicePlaceInfo({ service, liveInfo }: ServicePlaceInfoProps) {
  const hasCoords =
    typeof service.latitude === "number" &&
    typeof service.longitude === "number";

  const address = liveInfo?.address ?? service.address ?? null;
  const googleRating = liveInfo?.googleRating ?? service.googleRating ?? null;
  const googleRatingCount =
    liveInfo?.googleRatingCount ?? service.googleRatingCount ?? null;
  const openNow = liveInfo?.openNow ?? null;

  if (!hasCoords && !address && googleRating === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      {hasCoords ? (
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            pointerEvents="none"
            provider={PROVIDER_GOOGLE}
            scrollEnabled={false}
            zoomEnabled={false}
            initialRegion={{
              latitude: service.latitude as number,
              longitude: service.longitude as number,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: service.latitude as number,
                longitude: service.longitude as number,
              }}
            />
          </MapView>
        </View>
      ) : null}

      <View style={styles.infoRows}>
        {openNow !== null ? (
          <View style={styles.row}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: openNow ? "#16A34A" : "#DC2626" },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: openNow ? "#16A34A" : "#DC2626" },
              ]}
            >
              {openNow ? "Aberto agora" : "Fechado agora"}
            </Text>
          </View>
        ) : null}

        {googleRating !== null ? (
          <View style={styles.row}>
            <Ionicons color="#F59E0B" name="star" size={14} />
            <Text style={styles.rowText}>
              {googleRating.toFixed(1)}
              {googleRatingCount !== null
                ? ` · ${googleRatingCount} no Google`
                : " no Google"}
            </Text>
          </View>
        ) : null}

        {address ? (
          <View style={styles.row}>
            <Ionicons color="#6B7280" name="location-outline" size={14} />
            <Text style={styles.rowText}>{address}</Text>
          </View>
        ) : null}
      </View>

      {liveInfo && liveInfo.weekdayText.length > 0 ? (
        <View style={styles.hours}>
          <Text style={styles.hoursTitle}>Horários</Text>
          {liveInfo.weekdayText.map((line) => (
            <Text key={line} style={styles.hoursLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  hours: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
  },
  hoursLine: {
    color: "#374151",
    fontSize: 12,
    lineHeight: 20,
  },
  hoursTitle: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoRows: {
    gap: 8,
    marginTop: 12,
  },
  map: {
    height: "100%",
    width: "100%",
  },
  mapWrap: {
    borderRadius: 16,
    height: 160,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowText: {
    color: "#374151",
    flex: 1,
    fontSize: 13,
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
