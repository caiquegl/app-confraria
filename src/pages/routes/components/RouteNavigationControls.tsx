import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

type RouteNavigationControlsProps = {
  onOpenMedia: () => void;
  onRecenter: () => void;
};

export function RouteNavigationControls({
  onOpenMedia,
  onRecenter,
}: RouteNavigationControlsProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="Tirar foto ou registrar momento"
        accessibilityRole="button"
        style={styles.photoButton}
        onPress={onOpenMedia}
      >
        <Ionicons color={colors.brandDark} name="camera" size={18} />
      </Pressable>

      <Pressable
        accessibilityLabel="Centralizar no mapa"
        accessibilityRole="button"
        style={styles.button}
        onPress={onRecenter}
      >
        <Ionicons color="#374151" name="locate-outline" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    width: 40,
  },
  photoButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    height: 44,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    width: 44,
  },
  wrap: {
    alignItems: "center",
    gap: 12,
  },
});
