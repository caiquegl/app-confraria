import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { EventWizardLayout } from "./EventWizardLayout";
import { EVENT_CREATE_TOTAL_STEPS } from "../services/event-create.service";
import type { EventDraft, EventDraftUpdate } from "../types/event-create.types";

type EventStep4Props = {
  draft: EventDraft;
  isPublishing: boolean;
  onBack: () => void;
  onClose: () => void;
  onPublish: () => void;
  updateDraft: EventDraftUpdate;
};

export function EventStep4({
  draft,
  isPublishing,
  onBack,
  onClose,
  onPublish,
  updateDraft,
}: EventStep4Props) {
  const pickGalleryImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para escolher fotos.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 1,
      selectionLimit: 8,
    });

    if (!result.canceled) {
      const images = result.assets.map((asset) => asset.uri).filter(Boolean);
      updateDraft("gallery", [...draft.gallery, ...images]);
    }
  };

  return (
    <EventWizardLayout
      step={4}
      subtitle="Adicione fotos extras e confira as principais informações antes de publicar."
      title="Pronto para publicar"
      totalSteps={EVENT_CREATE_TOTAL_STEPS}
      onClose={onClose}
    >
      <View style={styles.form}>
        <View style={styles.reviewCard}>
          {draft.image ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              recyclingKey={draft.image}
              source={{ uri: draft.image }}
              style={styles.reviewImage}
            />
          ) : (
            <View style={styles.reviewImageFallback}>
              <Ionicons color="#9CA3AF" name="image-outline" size={26} />
            </View>
          )}

          <View style={styles.reviewContent}>
            <Text numberOfLines={2} style={styles.reviewTitle}>
              {draft.title || "Nome do evento"}
            </Text>
            <Text style={styles.reviewMeta}>{draft.category || "Categoria não definida"}</Text>
            <Text style={styles.reviewMeta}>
              {[draft.date, draft.startTime].filter(Boolean).join(" • ") || "Data e horário"}
            </Text>
            <Text numberOfLines={2} style={styles.reviewDescription}>
              {draft.description || "Descrição do evento aparecerá aqui."}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.label}>Galeria do evento</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.galleryPicker}
            onPress={pickGalleryImages}
          >
            <Ionicons color="#6B7280" name="images-outline" size={20} />
            <Text style={styles.galleryPickerText}>Adicionar imagens à galeria</Text>
          </Pressable>
        </View>

        {draft.gallery.length > 0 ? (
          <View style={styles.galleryGrid}>
            {draft.gallery.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.galleryItem}>
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  recyclingKey={uri}
                  source={{ uri }}
                  style={styles.galleryImage}
                />
                <Pressable
                  accessibilityRole="button"
                  style={styles.removeImageButton}
                  onPress={() =>
                    updateDraft(
                      "gallery",
                      draft.gallery.filter((_, imageIndex) => imageIndex !== index),
                    )
                  }
                >
                  <Ionicons color="#FFFFFF" name="close" size={14} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Button
          disabled={isPublishing}
          size="lg"
          style={styles.fullButton}
          onPress={onPublish}
        >
          {isPublishing ? "Publicando..." : "Publicar Evento"}
        </Button>
        <Button
          disabled={isPublishing}
          variant="secondary"
          size="lg"
          style={styles.fullButton}
          onPress={onBack}
        >
          Voltar
        </Button>
      </View>
    </EventWizardLayout>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 12,
    marginTop: 28,
  },
  form: {
    gap: 20,
  },
  fullButton: {
    width: "100%",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  galleryImage: {
    borderRadius: 14,
    height: "100%",
    width: "100%",
  },
  galleryItem: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    width: "31%",
  },
  galleryPicker: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  galleryPickerText: {
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
  removeImageButton: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.74)",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 24,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  reviewContent: {
    gap: 5,
    padding: 16,
  },
  reviewDescription: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  reviewImage: {
    height: 150,
    width: "100%",
  },
  reviewImageFallback: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    height: 150,
    justifyContent: "center",
    width: "100%",
  },
  reviewMeta: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },
  reviewTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "900",
  },
});
