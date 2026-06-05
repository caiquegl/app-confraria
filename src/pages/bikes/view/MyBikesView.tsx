import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { colors } from "@/theme/colors";

import {
  createUserBike,
  deleteUserBike,
  fetchBikeBrands,
  fetchUserBikes,
  updateUserBike,
} from "../services/bikes.service";
import type { BikeBrand, SaveUserBikePayload, UserBike } from "../types/bikes.types";
import { BikeDetailView } from "./BikeDetailView";

type MyBikesViewProps = {
  onBack: () => void;
};

type DetailMode = "list" | "create" | "edit";

export function MyBikesView({ onBack }: MyBikesViewProps) {
  const [bikes, setBikes] = useState<UserBike[]>([]);
  const [brands, setBrands] = useState<BikeBrand[]>([]);
  const [detailMode, setDetailMode] = useState<DetailMode>("list");
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBike = selectedBikeId
    ? bikes.find((bike) => bike.id === selectedBikeId)
    : undefined;

  const filteredBikes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return bikes;

    return bikes.filter((bike) =>
      [
        bike.brand.name,
        bike.model,
        bike.category ?? "",
        bike.color ?? "",
        bike.licensePlate ?? "",
        String(bike.year),
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [bikes, searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [nextBrands, nextBikes] = await Promise.all([
        fetchBikeBrands(),
        fetchUserBikes(),
      ]);
      setBrands(nextBrands);
      setBikes(nextBikes);
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar motos",
        text2: "Não foi possível buscar suas motos agora.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  const openCreate = () => {
    setSelectedBikeId(null);
    setDetailMode("create");
  };

  const openEdit = (bike: UserBike) => {
    setSelectedBikeId(bike.id);
    setDetailMode("edit");
  };

  const closeDetail = () => {
    setDetailMode("list");
    setSelectedBikeId(null);
  };

  const handleSaveBike = async (payload: SaveUserBikePayload) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const savedBike =
        detailMode === "edit" && selectedBike
          ? await updateUserBike(selectedBike.id, payload)
          : await createUserBike(payload);

      setBikes((current) => {
        const exists = current.some((bike) => bike.id === savedBike.id);
        return exists
          ? current.map((bike) => (bike.id === savedBike.id ? savedBike : bike))
          : [savedBike, ...current];
      });
      closeDetail();
      Toast.show({
        type: "success",
        text1: "Moto salva",
        text2: "Sua moto foi atualizada com sucesso.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar moto",
        text2: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    try {
      await deleteUserBike(bikeId);
      setBikes((current) => current.filter((bike) => bike.id !== bikeId));
      closeDetail();
      Toast.show({
        type: "success",
        text1: "Moto removida",
        text2: "A moto foi excluída do seu perfil.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao excluir moto",
        text2: "Não foi possível remover essa moto.",
      });
    }
  };

  if (detailMode === "create" || (detailMode === "edit" && selectedBike)) {
    return (
      <BikeDetailView
        bike={selectedBike}
        brands={brands}
        isSaving={isSaving}
        mode={detailMode === "edit" ? "edit" : "create"}
        onBack={closeDetail}
        onDelete={detailMode === "edit" ? (bikeId) => void handleDeleteBike(bikeId) : undefined}
        onSave={(payload) => void handleSaveBike(payload)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <View style={styles.searchBox}>
          <Ionicons color="#9CA3AF" name="search-outline" size={18} />
          <TextInput
            placeholder="Buscar moto por nome"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Minhas Motos</Text>

          {bikes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons color="#D1D5DB" name="bicycle-outline" size={46} />
              <Text style={styles.emptyText}>Nenhuma moto cadastrada ainda</Text>
              <AddBikeButton label="Adicionar Moto" onPress={openCreate} />
            </View>
          ) : (
            <View style={styles.list}>
              {filteredBikes.map((bike) => (
                <BikeCard key={bike.id} bike={bike} onPress={() => openEdit(bike)} />
              ))}

              {filteredBikes.length === 0 ? (
                <Text style={styles.noResults}>Nenhuma moto encontrada para essa busca.</Text>
              ) : null}

              <AddBikeButton label="Adicionar Nova Moto" onPress={openCreate} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AddBikeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.addCard} onPress={onPress}>
      <Ionicons color="#9CA3AF" name="add" size={26} />
      <Text style={styles.addCardText}>{label}</Text>
    </Pressable>
  );
}

function BikeCard({ bike, onPress }: { bike: UserBike; onPress: () => void }) {
  return (
    <Pressable style={styles.bikeCard} onPress={onPress}>
      {bike.imageUrl ? (
        <Image source={{ uri: bike.imageUrl }} style={styles.bikeImage} contentFit="cover" />
      ) : (
        <View style={styles.bikeImageFallback}>
          <Ionicons color="#9CA3AF" name="bicycle-outline" size={26} />
        </View>
      )}

      <View style={styles.bikeInfo}>
        <View style={styles.bikeTitleRow}>
          <Text style={styles.bikeTitle}>
            {bike.brand.name} {bike.model}
          </Text>
          {bike.isMainBike ? (
            <View style={styles.mainBadge}>
              <Text style={styles.mainBadgeText}>Principal</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.bikeMeta}>
          {bike.year} • {bike.baseConsumption} km/L • {bike.tankCapacity} L
        </Text>
        {bike.category ? <Text style={styles.bikeSubMeta}>{bike.category}</Text> : null}
        {bike.mileage !== null ? (
          <Text style={styles.bikeSubMeta}>{bike.mileage.toLocaleString("pt-BR")} km rodados</Text>
        ) : null}
        {bike.licensePlate ? (
          <Text style={styles.bikeSubMeta}>{formatPlate(bike.licensePlate)}</Text>
        ) : null}
        <Text style={styles.bikeActionText}>Toque para ver e editar</Text>
      </View>
    </Pressable>
  );
}

function formatPlate(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 3) return value;
  return `${value.slice(0, 3)}-${value.slice(3)}`;
}

const styles = StyleSheet.create({
  addCard: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 6,
    paddingVertical: 22,
    width: "100%",
  },
  addCardText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "700",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  bikeCard: {
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 136,
    padding: 8,
  },
  bikeActionText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  bikeImage: {
    borderRadius: 16,
    height: "100%",
    width: 84,
  },
  bikeImageFallback: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: "center",
    width: 84,
  },
  bikeInfo: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  bikeMeta: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 2,
  },
  bikeSubMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  bikeTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  bikeTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 52,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  list: {
    gap: 12,
  },
  mainBadge: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mainBadgeText: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: "800",
  },
  noResults: {
    color: "#6B7280",
    fontSize: 13,
    paddingVertical: 16,
    textAlign: "center",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
  },
});
