import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { StyleProp, TextStyle } from "react-native";

type NearbyCategoryIconProps = {
  category: string;
  color: string;
  size?: number;
  style?: StyleProp<TextStyle>;
};

export function isGasStationCategory(category: string): boolean {
  return category.includes("Posto") || category.includes("Gasolina");
}

export function NearbyCategoryIcon({
  category,
  color,
  size = 14,
  style,
}: NearbyCategoryIconProps) {
  if (isGasStationCategory(category)) {
    return (
      <MaterialCommunityIcons
        color={color}
        name="gas-station-outline"
        size={size}
        style={style}
      />
    );
  }

  if (category.includes("Mecân")) {
    return <Ionicons color={color} name="construct-outline" size={size} style={style} />;
  }

  if (category.includes("Restaur")) {
    return <Ionicons color={color} name="restaurant-outline" size={size} style={style} />;
  }

  if (category.includes("Hot")) {
    return <Ionicons color={color} name="bed-outline" size={size} style={style} />;
  }

  return <Ionicons color={color} name="location-outline" size={size} style={style} />;
}
