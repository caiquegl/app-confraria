import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { EventEditableList } from "./EventEditableList";
import { EventFormField } from "./EventFormField";
import { EventWizardLayout } from "./EventWizardLayout";
import { EVENT_CREATE_TOTAL_STEPS } from "../services/event-create.service";
import type { EventDraft, EventDraftUpdate } from "../types/event-create.types";

type EventStep3Props = {
  draft: EventDraft;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  updateDraft: EventDraftUpdate;
};

export function EventStep3({ draft, onBack, onClose, onNext, updateDraft }: EventStep3Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const updateLimit = (value: string) => {
    const normalized = value.replace(/\D/g, "");
    updateDraft("maxParticipants", normalized ? Number(normalized) : undefined);
  };

  const toggleParticipantLimit = () => {
    const nextValue = !draft.hasParticipantLimit;
    updateDraft("hasParticipantLimit", nextValue);

    if (!nextValue) {
      updateDraft("maxParticipants", undefined);
    }
  };

  return (
    <EventWizardLayout
      step={3}
      subtitle="Defina regras simples para alinhar expectativas dos participantes."
      title="Participantes e requisitos"
      totalSteps={EVENT_CREATE_TOTAL_STEPS}
      onClose={onClose}
    >
      <View style={styles.form}>
        <Pressable
          accessibilityRole="button"
          style={styles.toggleCard}
          onPress={toggleParticipantLimit}
        >
          <View style={styles.toggleIcon}>
            <Ionicons
              color={draft.hasParticipantLimit ? colors.brandDark : colors.text.muted}
              name={draft.hasParticipantLimit ? "checkmark-circle" : "ellipse-outline"}
              size={24}
            />
          </View>
          <View style={styles.toggleTextBlock}>
            <Text style={styles.toggleTitle}>Limitar participantes</Text>
            <Text style={styles.toggleSubtitle}>
              Ative caso o evento tenha limite de vagas.
            </Text>
          </View>
        </Pressable>

        {draft.hasParticipantLimit ? (
          <EventFormField
            keyboardType="number-pad"
            label="Número máximo de participantes"
            placeholder="Ex: 40"
            value={draft.maxParticipants ? String(draft.maxParticipants) : ""}
            onChangeText={updateLimit}
          />
        ) : null}

        <EventEditableList
          items={draft.included}
          label="O que está incluso"
          placeholder="Ex: Café da manhã"
          onChange={(items) => updateDraft("included", items)}
        />

        <EventEditableList
          items={draft.requirements}
          label="Requisitos para participar"
          placeholder="Ex: CNH válida"
          onChange={(items) => updateDraft("requirements", items)}
        />
      </View>

      <View style={styles.footer}>
        <Button size="lg" style={styles.fullButton} onPress={onNext}>
          Avançar
        </Button>
        <Button variant="secondary" size="lg" style={styles.fullButton} onPress={onBack}>
          Voltar
        </Button>
      </View>
    </EventWizardLayout>
  );
}

const createStyles = (colors: AppColors) => ({
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
  toggleCard: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  toggleIcon: {
    alignItems: "center",
    backgroundColor: colors.surface.disabled,
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  toggleSubtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  toggleTextBlock: {
    flex: 1,
  },
  toggleTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "800",
  },
});
