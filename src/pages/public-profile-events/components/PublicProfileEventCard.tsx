import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { PublicProfileEvent } from "../types/public-profile-events.types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c3d?q=80&w=800&auto=format&fit=crop";
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1614959541559-07085775f0f3?q=80&w=100&auto=format&fit=crop";

type PublicProfileEventCardProps = {
  event: PublicProfileEvent;
  onPress?: (event: PublicProfileEvent) => void;
  onToggleFavorite?: (event: PublicProfileEvent) => void;
};

export function PublicProfileEventCard({
  event,
  onPress,
  onToggleFavorite,
}: PublicProfileEventCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.eventCard}
      onPress={() => onPress?.(event)}
    >
      <View style={styles.imageWrap}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={`${event.id}-${event.image}`}
          source={{ uri: event.image || FALLBACK_IMAGE }}
          style={styles.eventImage}
        />

        <Pressable
          accessibilityRole="button"
          style={styles.favoriteButton}
          onPress={(pressEvent) => {
            pressEvent.stopPropagation();
            onToggleFavorite?.(event);
          }}
        >
          <Ionicons
            color={colors.brandDark}
            name={event.isFavorited ? "heart" : "heart-outline"}
            size={17}
          />
        </Pressable>
      </View>

      <View style={styles.eventContent}>
        <View style={styles.organizerRow}>
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={`${event.id}-${event.organizerAvatar ?? FALLBACK_AVATAR}`}
            source={{ uri: event.organizerAvatar ?? FALLBACK_AVATAR }}
            style={styles.organizerAvatar}
          />
          <View style={styles.organizerText}>
            <Text numberOfLines={1} style={styles.eventTitle}>
              {event.title}
            </Text>
            <Text numberOfLines={1} style={styles.organizerName}>
              {event.organizer || event.category}
            </Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.ratingRow}>
            <Ionicons color="#FB923C" name="star" size={12} />
            <Text style={styles.ratingText}>{event.rating.toFixed(1).replace(".", ",")}</Text>
            <Text style={styles.reviewText}>({event.reviews})</Text>
          </View>
          <Text numberOfLines={1} style={styles.eventDate}>
            {event.date}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 26,
    borderWidth: 1,
    elevation: 1,
    overflow: "hidden",
    padding: 8,
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  eventContent: {
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  eventDate: {
    color: "#9CA3AF",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  eventFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginTop: 8,
  },
  eventImage: {
    height: "100%",
    width: "100%",
  },
  eventTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
  favoriteButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    bottom: 10,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    width: 36,
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  organizerAvatar: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  organizerName: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  organizerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  organizerText: {
    flex: 1,
    minWidth: 0,
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  ratingText: {
    color: "#FB923C",
    fontSize: 12,
    fontWeight: "900",
  },
  reviewText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
});
