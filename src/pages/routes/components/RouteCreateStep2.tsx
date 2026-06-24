import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import type { UserBike } from "@/pages/bikes/types/bikes.types";
import { colors } from "@/theme/colors";

type RouteCreateStep2Props = {
  bikes: UserBike[];
  isLoading: boolean;
  onNavigateToMyBikes: () => void;
  onSelectBike: (bike: UserBike) => void;
  selectedBikeId: string | null;
};

export function RouteCreateStep2({
  bikes,
  isLoading,
  onNavigateToMyBikes,
  onSelectBike,
  selectedBikeId,
}: RouteCreateStep2Props) {
  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brandDark} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <Text style={styles.title}>Escolha a moto</Text>
      <Text style={styles.subtitle}>
        A autonomia muda o traçado destacado no mapa e as sugestões de abastecimento.
      </Text>

      {bikes.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons color="#9CA3AF" name="navigate-outline" size={24} />
          </View>
          <Text style={styles.emptyTitle}>Cadastre uma moto para continuar</Text>
          <Text style={styles.emptyText}>
            Consumo e tanque são usados para sugerir postos e avisos de autonomia.
          </Text>
          <Button size="lg" style={styles.emptyButton} onPress={onNavigateToMyBikes}>
            Ir para Minhas Motos
          </Button>
        </View>
      ) : (
        <View style={styles.list}>
          {bikes.map((bike) => {
            const isSelected = selectedBikeId === bike.id;
            const bikeName = `${bike.brand.name} ${bike.model}`.trim();

            return (
              <Pressable
                key={bike.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[styles.bikeCard, isSelected && styles.bikeCardSelected]}
                onPress={() => onSelectBike(bike)}
              >
                {bike.imageUrl ? (
                  <Image
                    source={{ uri: bike.imageUrl }}
                    style={styles.bikeImage}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    recyclingKey={bike.imageUrl}
                  />
                ) : (
                  <View style={styles.bikeImageFallback}>
                    <Ionicons color="#9CA3AF" name="bicycle-outline" size={24} />
                  </View>
                )}

                <View style={styles.bikeInfo}>
                  <Text numberOfLines={1} style={styles.bikeName}>
                    {bikeName}
                  </Text>
                  {bike.category ? (
                    <Text numberOfLines={1} style={styles.bikeMeta}>
                      {bike.category}
                    </Text>
                  ) : null}
                  <Text style={styles.bikeMeta}>
                    {bike.baseConsumption} km/L • {bike.tankCapacity} L
                  </Text>
                </View>

                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <Ionicons color={colors.brandDark} name="checkmark-circle" size={18} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bikeCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 16,
  },
  bikeCardSelected: {
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderColor: "rgba(200, 247, 99, 0.7)",
  },
  bikeImage: {
    borderRadius: 16,
    height: 60,
    width: 80,
  },
  bikeImageFallback: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    height: 60,
    justifyContent: "center",
    width: 80,
  },
  bikeInfo: {
    flex: 1,
    minWidth: 0,
  },
  bikeMeta: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  bikeName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyButton: {
    marginTop: 20,
    width: "100%",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FAFBF8",
    borderColor: "#E5E7EB",
    borderRadius: 22,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyIconWrap: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  list: {
    gap: 12,
    marginTop: 20,
  },
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 220,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  selectedBadge: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "800",
  },
});
