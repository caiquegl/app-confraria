import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { Service } from "../types/services.types";

export const SERVICES_CARD_WIDTH = 260;

type ServicesCardProps = {
  service: Service;
  onPress: (service: Service) => void;
  onToggleFavorite?: (service: Service) => void;
};

export function ServicesCard({
  service,
  onPress,
  onToggleFavorite,
}: ServicesCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable style={styles.card} onPress={() => onPress(service)}>
      <View style={styles.imageWrap}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: service.imageUrl ?? undefined }}
          style={styles.image}
        />

        {onToggleFavorite && (
          <Pressable
            accessibilityLabel={
              service.isFavorited
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"
            }
            accessibilityRole="button"
            hitSlop={8}
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(service)}
          >
            <Ionicons
              color={service.isFavorited ? colors.brandPrimary : colors.text.muted}
              name={service.isFavorited ? "heart" : "heart-outline"}
              size={16}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.logoPlaceholder}>
          <Ionicons
            color={colors.brandPrimary}
            name="storefront-outline"
            size={18}
          />
        </View>

        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.name}>
            {service.name}
          </Text>
          <Text numberOfLines={1} style={styles.category}>
            {service.category}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons color={colors.text.muted} name="location-outline" size={11} />
            <Text style={styles.metaText}>({service.reviewCount})</Text>
            <Ionicons color={colors.rating.star} name="star" size={11} />
            <Text style={[styles.metaText, styles.ratingText]}>
              {service.rating.toFixed(1)}
            </Text>
            <Text style={styles.metaText}>({service.reviewCount})</Text>
          </View>
          <Text numberOfLines={1} style={styles.phone}>
            {service.phone}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => ({
  card: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    width: SERVICES_CARD_WIDTH,
  },
  category: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 1,
  },
  favoriteButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: 999,
    elevation: 2,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    top: 10,
    width: 32,
  },
  image: {
    height: 130,
    width: "100%",
  },
  imageWrap: {
    position: "relative",
  },
  info: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  logoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderColor: colors.border.subtle,
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  name: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  phone: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 3,
  },
  ratingText: {
    color: colors.rating.star,
    fontWeight: "600",
  },
  textWrap: {
    flex: 1,
  },
});
