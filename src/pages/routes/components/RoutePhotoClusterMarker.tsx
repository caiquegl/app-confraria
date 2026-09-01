import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type RoutePhotoClusterMarkerProps = {
  photoCount: number;
};

export function RoutePhotoClusterMarker({ photoCount }: RoutePhotoClusterMarkerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View collapsable={false} style={styles.cameraPin}>
      <Ionicons color={colors.text.inverse} name="camera" size={16} />
      {photoCount > 1 ? (
        <View style={styles.cameraPinBadge}>
          <Text style={styles.cameraPinBadgeText}>{photoCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
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
