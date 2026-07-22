import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { MapMarkerPoint } from "../types/route-create.types";

type RouteMapMarkerProps = {
  marker: MapMarkerPoint;
};

function RouteMapMarkerComponent({ marker }: RouteMapMarkerProps) {
  const isStop = marker.kind === "stop";
  const isDestination = marker.kind === "day-destination";

  return (
    <View
      style={[
        styles.pin,
        isStop ? styles.pinStop : styles.pinMain,
        isDestination ? styles.pinDestination : null,
        !isStop && !isDestination ? { borderColor: marker.accentColor } : null,
        !isStop && !isDestination ? { backgroundColor: `${marker.accentColor}E6` } : null,
      ]}
    >
      <Text
        style={[
          styles.pinLabel,
          isStop ? styles.pinLabelStop : null,
          isDestination ? styles.pinLabelDestination : null,
          marker.kind === "day-transition" ? styles.pinLabelTransition : null,
        ]}
      >
        {marker.pinLabel}
      </Text>
    </View>
  );
}

export const RouteMapMarker = memo(RouteMapMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    alignItems: "center",
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: "center",
    shadowColor: "#1C2126",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  pinDestination: {
    backgroundColor: colors.brandDark,
    borderColor: "#FFFFFF",
    height: 34,
    width: 34,
  },
  pinLabel: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "800",
  },
  pinLabelDestination: {
    color: "#FFFFFF",
    fontSize: 10,
    marginTop: -1,
  },
  pinLabelStop: {
    color: "#4B5563",
    fontSize: 10,
    fontWeight: "700",
  },
  pinLabelTransition: {
    fontSize: 9,
  },
  pinMain: {
    height: 34,
    width: 34,
  },
  pinStop: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    height: 26,
    width: 26,
  },
});
