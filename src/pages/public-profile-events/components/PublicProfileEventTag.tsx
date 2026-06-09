import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type PublicProfileEventTagProps = {
  active?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

export function PublicProfileEventTag({
  active = false,
  icon,
  label,
}: PublicProfileEventTagProps) {
  return (
    <View style={[styles.tag, active && styles.tagActive]}>
      <Ionicons color={active ? "#166534" : "#6B7280"} name={icon} size={12} />
      <Text style={[styles.tagText, active && styles.tagTextActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tagActive: {
    backgroundColor: "#DCFCE7",
    borderColor: "#DCFCE7",
  },
  tagText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "800",
  },
  tagTextActive: {
    color: "#166534",
  },
});
