import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import type { UserBike } from "@/pages/bikes/types/bikes.types";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

const GARAGE_ROUTE = "/profile/bikes" as Href;

type RouteBikePickerSheetProps = {
  bikes: UserBike[];
  initialBikeId?: string | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (bike: UserBike) => void;
  visible: boolean;
};

export function RouteBikePickerSheet({
  bikes,
  initialBikeId,
  isLoading = false,
  onClose,
  onConfirm,
  visible,
}: RouteBikePickerSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialBikeId ?? bikes.find((bike) => bike.isMainBike)?.id ?? bikes[0]?.id,
  );

  useEffect(() => {
    if (!visible) return;
    setSelectedId(initialBikeId ?? bikes.find((bike) => bike.isMainBike)?.id ?? bikes[0]?.id);
  }, [bikes, initialBikeId, visible]);

  const selectedBike = bikes.find((bike) => bike.id === selectedId);
  const isEmpty = !isLoading && bikes.length === 0;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Escolha a moto</Text>
              <Text style={styles.subtitle}>Para iniciar o passeio com a autonomia certa</Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons color={colors.text.muted} name="close" size={18} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.brandDark} size="small" />
              <Text style={styles.loadingText}>Carregando suas motos...</Text>
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sua garagem está vazia</Text>
              <Text style={styles.emptyText}>Cadastre uma moto para iniciar o passeio.</Text>
              <Button
                size="lg"
                style={styles.emptyButton}
                onPress={() => {
                  onClose();
                  router.push(GARAGE_ROUTE);
                }}
              >
                Ir para Minhas Motos
              </Button>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                style={styles.listScroll}
              >
                {bikes.map((bike) => {
                  const isSelected = bike.id === selectedId;
                  const bikeName = `${bike.brand.name} ${bike.model}`.trim();

                  return (
                    <Pressable
                      key={bike.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      style={[styles.bikeCard, isSelected && styles.bikeCardSelected]}
                      onPress={() => setSelectedId(bike.id)}
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
                          <Ionicons color={colors.text.muted} name="bicycle-outline" size={22} />
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
              </ScrollView>

              <Button
                disabled={!selectedBike}
                size="lg"
                style={styles.confirmButton}
                onPress={() => {
                  if (!selectedBike) return;
                  onConfirm(selectedBike);
                }}
              >
                Confirmar
              </Button>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    flex: 1,
    justifyContent: "flex-end",
  },
  bikeCard: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 14,
  },
  bikeCardSelected: {
    backgroundColor: "rgba(200, 247, 99, 0.1)",
    borderColor: colors.brandGreen,
  },
  bikeImage: {
    borderRadius: 16,
    height: 56,
    width: 80,
  },
  bikeImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    width: 80,
  },
  bikeInfo: {
    flex: 1,
    minWidth: 0,
  },
  bikeMeta: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  bikeName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  confirmButton: {
    marginTop: 20,
    width: "100%",
  },
  emptyButton: {
    marginTop: 20,
    width: "100%",
  },
  emptyCard: {
    borderColor: colors.border.default,
    borderRadius: 22,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border.subtle,
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    gap: 10,
    paddingTop: 12,
  },
  listScroll: {
    maxHeight: 360,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  loadingWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 32,
  },
  selectedBadge: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
});
