import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

type RouteNavigationControlsProps = {
  onRecenter: () => void;
};

export function RouteNavigationControls({ onRecenter }: RouteNavigationControlsProps) {
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" style={styles.button} onPress={onRecenter}>
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
  wrap: {
    gap: 12,
  },
});
