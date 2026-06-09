import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c3d?q=80&w=900&auto=format&fit=crop";
const EVENT_SHARE_BASE_URL =
  process.env.EXPO_PUBLIC_EVENT_SHARE_BASE_URL ?? "https://confraria-web.vercel.app";

type EventDetailHeroCardProps = {
  category: string;
  coverImageUrl: string | null;
  eventId: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  title: string;
};

export function EventDetailHeroCard({
  category,
  coverImageUrl,
  eventId,
  isFavorited,
  onToggleFavorite,
  title,
}: EventDetailHeroCardProps) {
  const imageUrl = coverImageUrl || FALLBACK_IMAGE;
  const eventUrl = `${EVENT_SHARE_BASE_URL.replace(/\/$/, "")}/events/${eventId}`;

  const shareEvent = async () => {
    await Share.share({
      message: `Veja este evento no Confraria: ${title}\n${eventUrl}`,
      title,
      url: eventUrl,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={imageUrl}
          source={{ uri: imageUrl }}
          style={styles.image}
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.category}>{category}</Text>

      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" style={styles.primaryAction}>
          <Ionicons color={colors.brandDark} name="people-outline" size={18} />
          <Text style={styles.primaryActionText}>Mande para um seguidor</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.iconAction}
          onPress={() => void shareEvent()}
        >
          <Ionicons color={colors.brandDark} name="share-social-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    padding: 14,
  },
  category: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  iconAction: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "900",
  },
  title: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
});
