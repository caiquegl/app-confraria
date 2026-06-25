import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { Service } from "../types/services.types";

export const SERVICES_QUICK_CARD_WIDTH = 140;

type ServicesQuickCardProps = {
  service: Service;
  onPress: (service: Service) => void;
};

export function ServicesQuickCard({
  service,
  onPress,
}: ServicesQuickCardProps) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(service)}>
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        source={{ uri: service.imageUrl }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {service.name}
        </Text>
        <Text numberOfLines={1} style={styles.category}>
          {service.category}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons color="#F59E0B" name="star" size={12} />
          <Text style={styles.rating}>{service.rating.toFixed(1)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    elevation: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: SERVICES_QUICK_CARD_WIDTH,
  },
  category: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 1,
  },
  image: {
    height: 92,
    width: "100%",
  },
  info: {
    padding: 8,
  },
  name: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "600",
  },
  rating: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 3,
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 4,
  },
});
