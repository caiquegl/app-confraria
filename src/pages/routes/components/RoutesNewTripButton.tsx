import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type RoutesNewTripButtonProps = {
  onPress: () => void;
};

export function RoutesNewTripButton({ onPress }: RoutesNewTripButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Pressable
        accessibilityLabel="Planejar roteiro"
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onPress}
      >
        <Ionicons color={colors.brandDark} name="navigate" size={16} />
        <Text style={styles.label}>Planejar roteiro</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  button: {
    alignItems: "center",
    backgroundColor: colors.accent.brand,
    borderRadius: 999,
    elevation: 6,
    flexDirection: "row",
    gap: 6,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: "#9FC132",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  wrapper: {
    alignItems: "center",
    bottom: 16,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
});
