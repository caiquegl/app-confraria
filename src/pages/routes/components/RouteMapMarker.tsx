import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { MapMarkerPoint } from "../types/route-create.types";

type RouteMapMarkerProps = {
  marker: MapMarkerPoint;
};

function RouteMapMarkerComponent({ marker }: RouteMapMarkerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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

const createStyles = (colors: AppColors) => ({
  pin: {
    alignItems: "center",
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: "center",
    shadowColor: colors.text.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  pinDestination: {
    backgroundColor: colors.brandDark,
    borderColor: colors.surface.primary,
    height: 34,
    width: 34,
  },
  pinLabel: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "800",
  },
  pinLabelDestination: {
    color: colors.text.inverse,
    fontSize: 10,
    marginTop: -1,
  },
  pinLabelStop: {
    color: colors.text.comment,
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
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.default,
    height: 26,
    width: 26,
  },
});
