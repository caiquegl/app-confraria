import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Image } from "expo-image";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import type { SavedRoute } from "../types/saved-route.types";

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

function RouteTraceThumbnail({ route }: { route: SavedRoute }) {
  const seed = hashId(route.id);
  const path = MINI_PATHS[seed % MINI_PATHS.length];
  const stroke = MINI_STROKES[seed % MINI_STROKES.length];

  return (
    <View style={styles.thumbnail}>
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
        <Path d={path} fill="none" stroke={stroke} strokeLinecap="round" strokeWidth={6} />
        <Circle cx={14} cy={78} fill="#728F21" r={5} />
        <Circle cx={88} cy={22} fill="#1C2126" r={5} />
      </Svg>
    </View>
  );
}

function RouteCoverThumbnail({ coverImageUrl }: { coverImageUrl: string }) {
  return (
    <Image
      contentFit="cover"
      recyclingKey={coverImageUrl}
      source={{ uri: coverImageUrl }}
      style={styles.thumbnail}
    />
  );
}

function buildRouteTags(route: SavedRoute) {
  const tags = [route.distanceLabel];
  tags.push(`${route.dayCount} dia${route.dayCount === 1 ? "" : "s"}`);
  return tags.slice(0, 2);
}

type CommunityRouteCardProps = {
  onPress: () => void;
  route: SavedRoute;
};

export function CommunityRouteCard({ onPress, route }: CommunityRouteCardProps) {
  const tags = buildRouteTags(route);
  const regionLabel =
    route.regionLabel ??
    [route.originLabel, route.destinationLabel].filter(Boolean).join(" → ");

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.thumbnailWrap}>
        {route.thumbnailType === "image" && route.coverImageUrl ? (
          <RouteCoverThumbnail coverImageUrl={route.coverImageUrl} />
        ) : (
          <RouteTraceThumbnail route={route} />
        )}

        {route.rating != null ? (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingValue}>{route.rating.toFixed(1)}</Text>
            {route.reviewCount > 0 ? (
              <Text style={styles.ratingCount}>({route.reviewCount})</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title}>
          {route.title}
        </Text>
        <Text numberOfLines={1} style={styles.region}>
          {regionLabel}
        </Text>

        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {route.creator ? (
          <View style={styles.authorRow}>
            <UserAvatar avatarUrl={route.creator.avatarUrl} name={route.creator.name} size={28} />
            <Text numberOfLines={1} style={styles.authorName}>
              {route.creator.name}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  authorName: {
    color: "#6B7280",
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    minWidth: 0,
  },
  authorRow: {
    alignItems: "center",
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
  },
  body: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 24,
    borderWidth: 1,
    padding: 8,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    width: 256,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  ratingBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
    top: 8,
  },
  ratingCount: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  ratingStar: {
    color: "#FB923C",
    fontSize: 11,
  },
  ratingValue: {
    color: "#FB923C",
    fontSize: 11,
    fontWeight: "800",
  },
  region: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 8,
    marginTop: 2,
  },
  tag: {
    backgroundColor: "rgba(200, 247, 99, 0.15)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "600",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  thumbnail: {
    backgroundColor: "#EEF2EA",
    flex: 1,
  },
  thumbnailWrap: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
});
