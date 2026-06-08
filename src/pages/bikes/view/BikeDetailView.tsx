import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { SelectField } from "@/components/SelectField";
import { colors } from "@/theme/colors";

import type { BikeBrand, SaveUserBikePayload, UserBike } from "../types/bikes.types";

type BikeDetailViewProps = {
  bike?: UserBike;
  brands: BikeBrand[];
  isSaving?: boolean;
  mode: "create" | "edit";
  onBack: () => void;
  onDelete?: (bikeId: string) => void;
  onSave: (payload: SaveUserBikePayload) => void;
};

type StepTab = "essential" | "details";
type FormErrors = Partial<Record<"brandId" | "model" | "year" | "baseConsumption" | "tankCapacity", string>>;

const CURRENT_YEAR = new Date().getFullYear();

export function BikeDetailView({
  bike,
  brands,
  isSaving = false,
  mode,
  onBack,
  onDelete,
  onSave,
}: BikeDetailViewProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<StepTab>("essential");
  const [brandId, setBrandId] = useState(bike?.brand.id ?? "");
  const [model, setModel] = useState(bike?.model ?? "");
  const [year, setYear] = useState(String(bike?.year ?? CURRENT_YEAR));
  const [baseConsumption, setBaseConsumption] = useState(formatDecimal(bike?.baseConsumption ?? 15));
  const [tankCapacity, setTankCapacity] = useState(formatDecimal(bike?.tankCapacity ?? 15));
  const [isMainBike, setIsMainBike] = useState(bike?.isMainBike ?? false);
  const [category, setCategory] = useState(bike?.category ?? "");
  const [color, setColor] = useState(bike?.color ?? "");
  const [licensePlate, setLicensePlate] = useState(bike?.licensePlate ?? "");
  const [mileage, setMileage] = useState(bike?.mileage ? String(bike.mileage) : "");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ label: brand.name, value: brand.id })),
    [brands],
  );
  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const previewImage = imageUri ?? bike?.imageUrl ?? null;
  const headerTitle =
    mode === "create"
      ? "Nova Moto"
      : [bike?.brand.name, bike?.model].filter(Boolean).join(" ") || "Detalhes da Moto";

  const validateEssential = () => {
    const nextErrors: FormErrors = {};
    const parsedYear = Number(year);
    const parsedConsumption = parseDecimal(baseConsumption);
    const parsedTank = parseDecimal(tankCapacity);

    if (!brandId) nextErrors.brandId = "Marca obrigatória";
    if (!model.trim()) nextErrors.model = "Modelo obrigatório";
    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > CURRENT_YEAR) {
      nextErrors.year = "Ano inválido";
    }
    if (!parsedConsumption || parsedConsumption <= 0) {
      nextErrors.baseConsumption = "Consumo deve ser maior que 0";
    }
    if (!parsedTank || parsedTank <= 0) {
      nextErrors.tankCapacity = "Tanque deve ser maior que 0";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToDetails = () => {
    if (validateEssential()) setActiveTab("details");
  };

  const handleSave = () => {
    if (!validateEssential() || isSaving) return;

    onSave({
      baseConsumption: parseDecimal(baseConsumption) ?? 0,
      brandId,
      category,
      color,
      imageUri,
      isMainBike,
      licensePlate,
      mileage: mileage ? Number(mileage.replace(/\D/g, "")) : null,
      model,
      tankCapacity: parseDecimal(tankCapacity) ?? 0,
      year: Number(year),
    });
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à câmera para tirar a foto.",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
    setPhotoPickerOpen(false);
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para escolher a foto.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
      quality: 0.85,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
    setPhotoPickerOpen(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {headerTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 92 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>{mode === "create" ? "Cadastro" : "Sua moto"}</Text>
          <Text style={styles.summaryTitle}>
            {selectedBrand?.name || "Marca"} {model || "Modelo"}
          </Text>
          <Text style={styles.summaryText}>
            {year || "Ano"} • {baseConsumption || "--"} km/L • {tankCapacity || "--"} L
          </Text>
        </View>

        <View style={styles.tabs}>
          <TabButton
            active={activeTab === "essential"}
            label="Essencial"
            onPress={() => setActiveTab("essential")}
          />
          <TabButton active={activeTab === "details"} label="Opcional" onPress={goToDetails} />
        </View>

        {activeTab === "essential" ? (
          <View style={styles.card}>
            <FieldLabel text="Marca *" />
            <SelectField
              error={errors.brandId}
              label="Selecione uma marca"
              options={brandOptions}
              value={brandId}
              onChange={setBrandId}
            />

            <BikeInput
              error={errors.model}
              label="Modelo *"
              placeholder="Ex: CB 500F, MT-09"
              value={model}
              onChangeText={setModel}
            />
            <BikeInput
              error={errors.year}
              keyboardType="number-pad"
              label="Ano *"
              value={year}
              onChangeText={(value) => setYear(value.replace(/\D/g, "").slice(0, 4))}
            />
            <BikeInput
              error={errors.baseConsumption}
              keyboardType="decimal-pad"
              label="Consumo Base (km/L) *"
              value={baseConsumption}
              onChangeText={(value) => setBaseConsumption(normalizeDecimalInput(value))}
            />
            <BikeInput
              error={errors.tankCapacity}
              keyboardType="decimal-pad"
              label="Capacidade do Tanque (L) *"
              value={tankCapacity}
              onChangeText={(value) => setTankCapacity(normalizeDecimalInput(value))}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Definir como moto principal</Text>
              <Switch
                thumbColor={isMainBike ? colors.brandDark : "#F9FAFB"}
                trackColor={{ false: "#D1D5DB", true: colors.brandGreen }}
                value={isMainBike}
                onValueChange={setIsMainBike}
              />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <FieldLabel text="Foto (opcional)" />
            {previewImage ? (
              <View style={styles.photoPreviewWrap}>
                <Image
                  source={{ uri: previewImage }}
                  style={styles.photoPreview}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  recyclingKey={previewImage}
                />
                <Button variant="secondary" onPress={() => setPhotoPickerOpen(true)}>
                  Trocar foto
                </Button>
              </View>
            ) : (
              <Pressable style={styles.photoButton} onPress={() => setPhotoPickerOpen(true)}>
                <Ionicons color="#6B7280" name="camera-outline" size={20} />
                <Text style={styles.photoButtonText}>Tirar ou escolher foto</Text>
              </Pressable>
            )}

            <BikeInput
              label="Categoria (opcional)"
              placeholder="Ex: Big Trail, Naked, Custom"
              value={category}
              onChangeText={setCategory}
            />
            <BikeInput
              label="Cor (opcional)"
              placeholder="Cor"
              value={color}
              onChangeText={setColor}
            />
            <BikeInput
              autoCapitalize="characters"
              label="Placa (opcional)"
              placeholder="ABC-1234"
              value={maskPlate(licensePlate)}
              onChangeText={(value) => setLicensePlate(normalizePlate(value))}
            />
            <BikeInput
              keyboardType="number-pad"
              label="Quilometragem (opcional)"
              placeholder="Quilometragem"
              value={mileage}
              onChangeText={(value) => setMileage(value.replace(/\D/g, "").slice(0, 7))}
            />

            {mode === "edit" && bike && onDelete ? (
              <View style={styles.dangerBox}>
                <Text style={styles.dangerTitle}>Zona de Perigo</Text>
                <Text style={styles.dangerText}>
                  Apague esta moto se ela não fizer mais parte do seu perfil.
                </Text>
                <Button variant="destructive" onPress={() => setDeleteConfirmOpen(true)}>
                  Apagar moto
                </Button>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          disabled={isSaving}
          size="lg"
          style={styles.footerButton}
          onPress={activeTab === "essential" && mode === "create" ? goToDetails : handleSave}
        >
          {isSaving
            ? "Salvando..."
            : activeTab === "essential" && mode === "create"
              ? "Continuar"
              : "Salvar"}
        </Button>
      </View>

      <PhotoPickerSheet
        visible={photoPickerOpen}
        onCamera={() => void openCamera()}
        onClose={() => setPhotoPickerOpen(false)}
        onGallery={() => void openGallery()}
      />

      {deleteConfirmOpen && bike && onDelete ? (
        <ConfirmDeleteSheet
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            setDeleteConfirmOpen(false);
            onDelete(bike.id);
          }}
        />
      ) : null}
    </View>
  );
}

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function BikeInput({
  autoCapitalize,
  error,
  keyboardType = "default",
  label,
  placeholder,
  value,
  onChangeText,
}: {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <FieldLabel text={label} />
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function PhotoPickerSheet({
  visible,
  onCamera,
  onClose,
  onGallery,
}: {
  visible: boolean;
  onCamera: () => void;
  onClose: () => void;
  onGallery: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.actionSheet}>
          <Text style={styles.actionSheetTitle}>Adicionar foto</Text>
          <Pressable style={styles.sheetOption} onPress={onCamera}>
            <Ionicons color={colors.brandDark} name="camera-outline" size={20} />
            <Text style={styles.sheetOptionText}>Tirar foto</Text>
          </Pressable>
          <Pressable style={styles.sheetOption} onPress={onGallery}>
            <Ionicons color={colors.brandDark} name="images-outline" size={20} />
            <Text style={styles.sheetOptionText}>Escolher da galeria</Text>
          </Pressable>
          <Pressable style={styles.cancelSheetOption} onPress={onClose}>
            <Text style={styles.cancelSheetText}>Cancelar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function ConfirmDeleteSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.modalBackdrop}>
        <View style={styles.confirmSheet}>
          <Text style={styles.confirmTitle}>Apagar moto?</Text>
          <Text style={styles.confirmText}>
            Essa ação remove a moto da sua área e do planejamento de rotas.
          </Text>
          <View style={styles.confirmActions}>
            <Button variant="secondary" style={styles.confirmButton} onPress={onCancel}>
              Cancelar
            </Button>
            <Button variant="destructive" style={styles.confirmButton} onPress={onConfirm}>
              Excluir
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function parseDecimal(value: string): number | null {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDecimal(value: number): string {
  return String(value).replace(".", ",");
}

function normalizeDecimalInput(value: string): string {
  const cleaned = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integer = "", ...rest] = cleaned.split(".");
  const decimal = rest.join("").slice(0, 2);
  return decimal ? `${integer.slice(0, 3)},${decimal}` : integer.slice(0, 3);
}

function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

function maskPlate(value: string): string {
  const normalized = normalizePlate(value);
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

const styles = StyleSheet.create({
  actionSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
    padding: 24,
  },
  actionSheetTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
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
  cancelSheetOption: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelSheetText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
  },
  confirmSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    margin: 18,
    padding: 22,
  },
  confirmText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  content: {
    gap: 16,
    padding: 24,
  },
  dangerBox: {
    borderColor: "#FECACA",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  dangerText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  dangerTitle: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "800",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  footerButton: {
    width: "100%",
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
  headerTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  photoButton: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 18,
  },
  photoButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },
  photoPreview: {
    borderRadius: 16,
    height: 170,
    width: "100%",
  },
  photoPreviewWrap: {
    gap: 10,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  sheetOption: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  sheetOptionText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  summaryEyebrow: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  summaryText: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 8,
  },
  summaryTitle: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "800",
  },
  switchLabel: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingTop: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.brandGreen,
  },
  tabs: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  tabText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.brandDark,
    fontWeight: "900",
  },
});
