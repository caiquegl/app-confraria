import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

import { NAV_CONTROL_BUTTON_SIZE } from "./route-navigation-controls.constants";

type RouteNavigationControlsProps = {
  onOpenMedia: () => void;
  onRecenter: () => void;
  onReport: () => void;
};

export function RouteNavigationControls({
  onOpenMedia,
  onRecenter,
  onReport,
}: RouteNavigationControlsProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="Reportar ocorrência na rota"
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, styles.reportButton, pressed && styles.pressed]}
        onPress={onReport}
      >
        <Ionicons color="#FFFFFF" name="warning" size={26} />
      </Pressable>

      <Pressable
        accessibilityLabel="Tirar foto ou registrar momento"
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, styles.photoButton, pressed && styles.pressed]}
        onPress={onOpenMedia}
      >
        <Ionicons color={colors.brandDark} name="camera" size={24} />
      </Pressable>

      <Pressable
        accessibilityLabel="Centralizar no mapa"
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, styles.recenterButton, pressed && styles.pressed]}
        onPress={onRecenter}
      >
        <Ionicons color={colors.brandDark} name="locate" size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 999,
    height: NAV_CONTROL_BUTTON_SIZE,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    width: NAV_CONTROL_BUTTON_SIZE,
    elevation: 6,
  },
  photoButton: {
    backgroundColor: colors.brandGreen,
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.8,
  },
  recenterButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD1D6",
    borderWidth: 1.5,
  },
  reportButton: {
    backgroundColor: "#F97316",
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },
  wrap: {
    alignItems: "center",
    gap: 12,
  },
});
