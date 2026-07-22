import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

type StarRatingProps = {
  value: number;
  size?: number;
  editable?: boolean;
  onChange?: (value: number) => void;
};

export function StarRating({
  value,
  size = 20,
  editable = false,
  onChange,
}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= Math.round(value);
        const icon = (
          <Ionicons
            color={active ? "#F59E0B" : "#D1D5DB"}
            name={active ? "star" : "star-outline"}
            size={size}
          />
        );

        if (!editable) {
          return <View key={star}>{icon}</View>;
        }

        return (
          <Pressable
            key={star}
            accessibilityLabel={`Nota ${star}`}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => onChange?.(star)}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
  },
});
