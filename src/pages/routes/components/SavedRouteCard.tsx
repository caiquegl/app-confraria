import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/theme/colors";

import type { SavedRoute } from "../types/saved-route.types";
import {
  formatTripDateLabel,
  isRouteCompleted,
  isRouteOngoing,
} from "../utils/saved-routes-filters.utils";

const MINI_STROKES = ["#B8E43A", "#5FB6FF", "#FF8A5B", "#728F21", "#9D8CFF"];
const MINI_PATHS = [
  "M14,78 C32,58 46,68 60,42 S84,24 88,20",
  "M10,82 C26,66 36,54 50,54 S72,34 90,24",
  "M14,76 C32,72 42,50 58,48 S80,30 86,22",
  "M12,80 C30,62 44,66 58,44 S82,26 88,20",
];

function hashId(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash;
}

type MiniRouteTraceProps = {
  route: SavedRoute;
  size: number;
};

function MiniRouteTrace({ route, size }: MiniRouteTraceProps) {
  const ongoing = isRouteOngoing(route);
  const seed = hashId(route.id);
  const path = MINI_PATHS[seed % MINI_PATHS.length];
  const stroke = ongoing ? "#728F21" : MINI_STROKES[seed % MINI_STROKES.length];

  return (
    <View style={[styles.trace, { height: size, width: size }]}>
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
        <Path d={path} fill="none" stroke={stroke} strokeLinecap="round" strokeWidth={6} />
        <Circle cx={14} cy={78} fill="#728F21" r={5} />
        <Circle cx={88} cy={22} fill="#1C2126" r={5} />
      </Svg>
    </View>
  );
}

function StatusTag({ route }: { route: SavedRoute }) {
  if (isRouteCompleted(route)) {
    return (
      <View style={[styles.tag, styles.tagCompleted]}>
        <Text style={styles.tagCompletedText}>✓ Já viajei</Text>
      </View>
    );
  }

  if (isRouteOngoing(route)) {
    return (
      <View style={[styles.tag, styles.tagOngoing]}>
        <Text style={styles.tagOngoingText}>Em andamento</Text>
      </View>
    );
  }

  return (
    <View style={[styles.tag, styles.tagMuted]}>
      <Text style={styles.tagMutedText}>
        {route.tripDate ? formatTripDateLabel(route.tripDate) : "Sem data"}
      </Text>
    </View>
  );
}

type SavedRouteCardProps = {
  fullWidth?: boolean;
  onPress: () => void;
  route: SavedRoute;
};

export function SavedRouteCard({ fullWidth = false, onPress, route }: SavedRouteCardProps) {
  const ongoing = isRouteOngoing(route);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        fullWidth ? styles.cardFullWidth : ongoing ? styles.cardOngoing : styles.cardDefault,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <MiniRouteTrace route={route} size={ongoing ? 52 : 46} />
        <View style={styles.copy}>
          <View style={styles.pathRow}>
            <Text numberOfLines={1} style={[styles.pathText, ongoing && styles.pathTextOngoing]}>
              {route.originLabel}
            </Text>
            <Text style={styles.pathArrow}>→</Text>
            <Text numberOfLines={1} style={[styles.pathText, ongoing && styles.pathTextOngoing]}>
              {route.destinationLabel}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.title}>
            {route.title}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{route.distanceLabel}</Text>
        <View style={styles.metaDot} />
        <Text style={styles.metaText}>{route.durationLabel}</Text>
        <View style={styles.metaDot} />
        <Text style={styles.metaText}>
          {route.dayCount} dia{route.dayCount === 1 ? "" : "s"}
        </Text>
      </View>

      {ongoing ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "35%" }]} />
        </View>
      ) : null}

      <View style={styles.tagsRow}>
        <StatusTag route={route} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
  },
  cardDefault: {
    borderColor: "#E5E7EB",
    borderWidth: 1,
    width: 236,
  },
  cardFullWidth: {
    borderColor: "#728F21",
    borderWidth: 1.5,
    width: "100%",
  },
  cardOngoing: {
    borderColor: "#728F21",
    borderWidth: 1.5,
    shadowColor: "rgba(114, 143, 33, 0.14)",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    width: 300,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  metaDot: {
    backgroundColor: "#D1D5DB",
    borderRadius: 999,
    height: 3,
    width: 3,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  metaText: {
    color: "#6B7280",
    fontSize: 11,
  },
  pathArrow: {
    color: "#728F21",
    fontSize: 12,
    fontWeight: "700",
  },
  pathRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  pathText: {
    color: colors.brandDark,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  pathTextOngoing: {
    fontSize: 15,
  },
  progressFill: {
    backgroundColor: "#728F21",
    borderRadius: 999,
    height: "100%",
  },
  progressTrack: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    height: 4,
    marginTop: 10,
    overflow: "hidden",
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagCompleted: {
    backgroundColor: "rgba(200, 247, 99, 0.3)",
    borderColor: colors.brandGreen,
  },
  tagCompletedText: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: "700",
  },
  tagMuted: {
    borderColor: "#E5E7EB",
  },
  tagMutedText: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "600",
  },
  tagOngoing: {
    backgroundColor: "rgba(114, 143, 33, 0.1)",
    borderColor: "#728F21",
  },
  tagOngoingText: {
    color: "#728F21",
    fontSize: 10,
    fontWeight: "800",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  title: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  trace: {
    backgroundColor: "#EEF2EA",
    borderColor: "#F3F4F6",
    borderRadius: 13,
    borderWidth: 1,
    overflow: "hidden",
  },
});
