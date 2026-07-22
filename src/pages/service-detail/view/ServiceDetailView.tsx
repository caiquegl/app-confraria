import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { ReviewComposer } from "../components/ReviewComposer";
import { ReviewItem } from "../components/ReviewItem";
import { StarRating } from "../components/StarRating";
import { useServiceDetail } from "../business/useServiceDetail";

type ServiceDetailViewProps = {
  serviceId: string;
};

export function ServiceDetailView({ serviceId }: ServiceDetailViewProps) {
  const insets = useSafeAreaInsets();
  const {
    error,
    isLoading,
    isSubmitting,
    myReview,
    reload,
    removeReview,
    reviews,
    service,
    submitReview,
    toggleFavorite,
  } = useServiceDetail(serviceId);

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.stateText}>
          {error ?? "Serviço não encontrado."}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.retryButton}
          onPress={reload}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const handleCall = () => {
    const digits = service.phone.replace(/[^\d+]/g, "");
    if (digits) {
      Linking.openURL(`tel:${digits}`).catch(() => undefined);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: service.imageUrl ?? undefined }}
            style={styles.heroImage}
          />

          <Pressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            hitSlop={8}
            style={[styles.circleButton, { top: insets.top + 8, left: 16 }]}
            onPress={() => router.back()}
          >
            <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
          </Pressable>

          <Pressable
            accessibilityLabel={
              service.isFavorited
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"
            }
            accessibilityRole="button"
            hitSlop={8}
            style={[
              styles.circleButton,
              { top: insets.top + 8, right: 16 },
              service.isFavorited && styles.circleButtonActive,
            ]}
            onPress={toggleFavorite}
          >
            <View style={styles.favoriteIcon}>
              <Ionicons
                color={service.isFavorited ? colors.brandGreen : "#FFFFFF"}
                name="heart"
                size={20}
              />
              <Ionicons
                color="#9CA3AF"
                name="heart-outline"
                size={20}
                style={styles.favoriteOutline}
              />
            </View>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.name}>{service.name}</Text>
          <Text style={styles.category}>{service.category}</Text>

          <View style={styles.ratingRow}>
            <StarRating size={16} value={service.rating} />
            <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>
              ({service.reviewCount}{" "}
              {service.reviewCount === 1 ? "avaliação" : "avaliações"})
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.callButton}
            onPress={handleCall}
          >
            <Ionicons color={colors.brandDark} name="call" size={16} />
            <Text style={styles.callText}>{service.phone}</Text>
          </Pressable>
        </View>

        <ReviewComposer
          isSubmitting={isSubmitting}
          myReview={myReview}
          onDelete={removeReview}
          onSubmit={(rating, comment) =>
            submitReview({ rating, comment: comment || undefined })
          }
        />

        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>Avaliações</Text>

          {reviews.length === 0 ? (
            <Text style={styles.emptyReviews}>
              Ainda não há avaliações. Seja o primeiro a avaliar!
            </Text>
          ) : (
            reviews.map((review, index) => (
              <View key={review.id}>
                {index > 0 && <View style={styles.divider} />}
                <ReviewItem review={review} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  callButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  callText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  category: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 2,
  },
  centered: {
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  circleButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    elevation: 3,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: 40,
  },
  circleButtonActive: {
    backgroundColor: colors.brandGreen,
  },
  favoriteIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteOutline: {
    position: "absolute",
  },
  divider: {
    backgroundColor: "#F3F4F6",
    height: 1,
  },
  emptyReviews: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hero: {
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  heroImage: {
    height: 240,
    width: "100%",
  },
  name: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "800",
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  ratingText: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  reviewCount: {
    color: "#6B7280",
    fontSize: 13,
  },
  reviewsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  reviewsTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  stateText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});
