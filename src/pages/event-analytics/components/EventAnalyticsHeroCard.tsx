import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c3d?q=80&w=900&auto=format&fit=crop";

type EventAnalyticsHeroCardProps = {
  category: string;
  coverImageUrl: string | null;
  title: string;
};

export function EventAnalyticsHeroCard({
  category,
  coverImageUrl,
  title,
}: EventAnalyticsHeroCardProps) {
  const imageUrl = coverImageUrl || FALLBACK_IMAGE;

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
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: "100%",
  },
  title: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
});
