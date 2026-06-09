import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { EventFormField } from "./EventFormField";
import { EventWizardLayout } from "./EventWizardLayout";
import { EVENT_CATEGORIES, EVENT_CREATE_TOTAL_STEPS } from "../services/event-create.service";
import type { EventDraft, EventDraftUpdate } from "../types/event-create.types";

type EventStep1Props = {
  draft: EventDraft;
  onClose: () => void;
  onNext: () => void;
  updateDraft: EventDraftUpdate;
};

export function EventStep1({ draft, onClose, onNext, updateDraft }: EventStep1Props) {
  const canAdvance = draft.title.trim() !== "" && draft.category.trim() !== "";

  const pickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para escolher a capa.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      updateDraft("image", result.assets[0].uri);
    }
  };

  return (
    <EventWizardLayout
      step={1}
      subtitle="Comece com o básico. Você poderá revisar tudo antes de publicar."
      title="Vamos criar seu evento"
      totalSteps={EVENT_CREATE_TOTAL_STEPS}
      onClose={onClose}
    >
      <View style={styles.form}>
        <View>
          <Text style={styles.label}>Imagem de capa</Text>
          {draft.image ? (
            <View style={styles.coverCard}>
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={draft.image}
                source={{ uri: draft.image }}
                style={styles.coverImage}
              />
              <View style={styles.coverActions}>
                <Pressable style={styles.coverActionButton} onPress={pickCoverImage}>
                  <Text style={styles.coverActionText}>Trocar imagem</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.deleteButton}
                  onPress={() => updateDraft("image", "")}
                >
                  <Ionicons color="#EF4444" name="trash-outline" size={18} />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.imagePickerButton} onPress={pickCoverImage}>
              <Ionicons color="#6B7280" name="camera-outline" size={20} />
              <Text style={styles.imagePickerText}>Adicionar imagem de capa</Text>
            </Pressable>
          )}
        </View>

        <EventFormField
          label="Nome do evento *"
          placeholder="Ex: Route 66 Moto Adventure"
          value={draft.title}
          onChangeText={(value) => updateDraft("title", value)}
        />

        <View>
          <Text style={styles.label}>Categoria *</Text>
          <View style={styles.categories}>
            {EVENT_CATEGORIES.map((category) => {
              const selected = draft.category === category;
              return (
                <Pressable
                  key={category}
                  style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  onPress={() => updateDraft("category", category)}
                >
                  <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <EventFormField
          multiline
          label="Sobre o evento"
          placeholder="Descreva o evento, o trajeto, os pontos de parada..."
          value={draft.description}
          onChangeText={(value) => updateDraft("description", value)}
        />
      </View>

      <View style={styles.footer}>
        <Button disabled={!canAdvance} size="lg" style={styles.fullButton} onPress={onNext}>
          Avançar
        </Button>
      </View>
    </EventWizardLayout>
  );
}

const styles = StyleSheet.create({
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  categoryChipActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  categoryText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
  },
  categoryTextActive: {
    color: colors.brandDark,
  },
  coverActionButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: "center",
  },
  coverActions: {
    flexDirection: "row",
    gap: 10,
  },
  coverActionText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  coverCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  coverImage: {
    borderRadius: 14,
    height: 160,
    width: "100%",
  },
  deleteButton: {
    alignItems: "center",
    borderColor: "#FECACA",
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 48,
  },
  footer: {
    marginTop: 28,
  },
  form: {
    gap: 20,
  },
  fullButton: {
    width: "100%",
  },
  imagePickerButton: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  imagePickerText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
});
