import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { EventGalleryImagePicker } from "./EventGalleryImagePicker";
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

        <EventGalleryImagePicker
          images={draft.gallery}
          onChange={(images) => updateDraft("gallery", images)}
        />
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
