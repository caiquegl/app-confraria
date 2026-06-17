import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/theme/colors";

type EventsCreateFabProps = {
  onPress: () => void;
};

export function EventsCreateFab({ onPress }: EventsCreateFabProps) {
  return (
    <Pressable
      accessibilityLabel="Criar"
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={onPress}
    >
      <Ionicons color={colors.brandDark} name="add" size={26} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    bottom: 18,
    elevation: 8,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    shadowColor: "#9FC132",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    width: 56,
    zIndex: 20,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
});
