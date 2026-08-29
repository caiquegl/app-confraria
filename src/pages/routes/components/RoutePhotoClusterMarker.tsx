import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type RoutePhotoClusterMarkerProps = {
  photoCount: number;
};

export function RoutePhotoClusterMarker({ photoCount }: RoutePhotoClusterMarkerProps) {
  return (
    <View collapsable={false} style={styles.cameraPin}>
      <Ionicons color="#FFFFFF" name="camera" size={16} />
      {photoCount > 1 ? (
        <View style={styles.cameraPinBadge}>
          <Text style={styles.cameraPinBadgeText}>{photoCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
