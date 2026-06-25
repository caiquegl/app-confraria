import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

export type MapStyleElement = Record<string, unknown>;

export const PROVIDER_GOOGLE = "google";

type MapViewProps = {
  children?: ReactNode;
  style?: ViewStyle;
};

export default function MapView({ children, style }: MapViewProps) {
  return <View style={style}>{children}</View>;
}

export function Marker({ children }: { children?: ReactNode }) {
  return <View>{children}</View>;
}

export function Polyline() {
  return null;
}
