import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { EventCoverImagePicker } from "./EventCoverImagePicker";
import { EventFormField } from "./EventFormField";
import { EventWizardLayout } from "./EventWizardLayout";
import { EVENT_CREATE_TOTAL_STEPS } from "../services/event-create.service";
import type { EventCategory, EventDraft, EventDraftUpdate } from "../types/event-create.types";

type EventStep1Props = {
  categories: EventCategory[];
  categoriesError: boolean;
  draft: EventDraft;
  isLoadingCategories: boolean;
  onClose: () => void;
  onNext: () => void;
  updateDraft: EventDraftUpdate;
};

export function EventStep1({
  categories,
  categoriesError,
  draft,
  isLoadingCategories,
  onClose,
  onNext,
  updateDraft,
}: EventStep1Props) {
  const canAdvance = draft.title.trim() !== "" && draft.category.trim() !== "";

  return (
    <EventWizardLayout
      step={1}
      subtitle="Comece com o básico. Você poderá revisar tudo antes de publicar."
      title="Vamos criar seu evento"
      totalSteps={EVENT_CREATE_TOTAL_STEPS}
      onClose={onClose}
    >
      <View style={styles.form}>
        <EventCoverImagePicker
          imageUri={draft.image}
          onChange={(uri) => updateDraft("image", uri)}
          onRemove={() => updateDraft("image", "")}
        />

        <EventFormField
          label="Nome do evento *"
          placeholder="Ex: Route 66 Moto Adventure"
          value={draft.title}
          onChangeText={(value) => updateDraft("title", value)}
        />

        <View>
          <Text style={styles.label}>Categoria *</Text>
          {isLoadingCategories ? (
            <Text style={styles.categoryHint}>Carregando categorias...</Text>
          ) : categoriesError ? (
            <Text style={styles.categoryHint}>
              Não foi possível carregar as categorias. Tente novamente em instantes.
            </Text>
          ) : (
            <View style={styles.categories}>
              {categories.map((category) => {
                const selected = draft.category === category.name;
                return (
                  <Pressable
                    key={category.id}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                    onPress={() => updateDraft("category", category.name)}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
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
  categoryHint: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  categoryText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
  },
  categoryTextActive: {
    color: colors.brandDark,
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
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
});
