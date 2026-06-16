import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { EventCoverImagePicker } from "@/pages/event-create/components/EventCoverImagePicker";
import { EventEditableList } from "@/pages/event-create/components/EventEditableList";
import { EventFormField } from "@/pages/event-create/components/EventFormField";
import { EventGalleryImagePicker } from "@/pages/event-create/components/EventGalleryImagePicker";
import { EventPlaceAutocompleteField } from "@/pages/event-create/components/EventPlaceAutocompleteField";
import {
  fetchEventCategories,
  formatBrazilianDateInput,
  formatEventDuration,
  formatEventWeekday,
  formatTimeInput,
  isPastBrazilianDate,
  isValidBrazilianDate,
  isValidTime,
} from "@/pages/event-create/services/event-create.service";
import type { EventCategory, EventPlaceReference } from "@/pages/event-create/types/event-create.types";
import { fetchEventDetail } from "@/pages/event-detail/services/event-detail.service";
import { colors } from "@/theme/colors";

import { EventEditLayout } from "../components/EventEditLayout";
import { EventEditSection } from "../components/EventEditSection";
import { useEventEditDraft } from "../hooks/useEventEditDraft";
import { mapEventDetailToDraft, updateEvent } from "../services/event-edit.service";

type EventEditViewProps = {
  eventId: string;
  onBack: () => void;
  onSaved: () => void;
};

export function EventEditView({ eventId, onBack, onSaved }: EventEditViewProps) {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [hasError, setHasError] = useState(false);
  const [initialDraft, setInitialDraft] = useState<ReturnType<typeof mapEventDetailToDraft> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const [event, eventCategories] = await Promise.all([
          fetchEventDetail(eventId),
          fetchEventCategories(),
        ]);

        if (cancelled) return;

        if (!event.isOwner) {
          setHasError(true);
          setInitialDraft(null);
          return;
        }

        if (!event.canEdit) {
          setHasError(true);
          setInitialDraft(null);
          return;
        }

        setCategories(eventCategories);
        setInitialDraft(mapEventDetailToDraft(event));
        setUserId(event.organizer.id);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setInitialDraft(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (isLoading) {
    return (
      <View style={styles.feedbackScreen}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
        <Text style={styles.feedbackText}>Carregando evento...</Text>
      </View>
    );
  }

  if (hasError || !initialDraft) {
    return (
      <View style={styles.feedbackScreen}>
        <Ionicons color="#9CA3AF" name="alert-circle-outline" size={32} />
        <Text style={styles.feedbackText}>
          Não foi possível editar este evento. Ele já ocorreu ou está em andamento.
        </Text>
        <Button size="lg" onPress={onBack}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <EventEditForm
      key={eventId}
      categories={categories}
      eventId={eventId}
      initialDraft={initialDraft}
      isSaving={isSaving}
      userId={userId}
      onBack={onBack}
      onSaved={onSaved}
      onSavingChange={setIsSaving}
    />
  );
}

type EventEditFormProps = {
  categories: EventCategory[];
  eventId: string;
  initialDraft: ReturnType<typeof mapEventDetailToDraft>;
  isSaving: boolean;
  userId: string;
  onBack: () => void;
  onSaved: () => void;
  onSavingChange: (value: boolean) => void;
};

function EventEditForm({
  categories,
  eventId,
  initialDraft,
  isSaving,
  userId,
  onBack,
  onSaved,
  onSavingChange,
}: EventEditFormProps) {
  const { buildPayload, draft, updateDraft } = useEventEditDraft(initialDraft, userId);

  const dateIsComplete = draft.date.length === 10;
  const dateIsPast = dateIsComplete && isPastBrazilianDate(draft.date);
  const startTimeIsComplete = draft.startTime.length === 5;
  const endTimeIsComplete = draft.endTime.length === 5;
  const hasInvalidDate =
    draft.date.length > 0 &&
    (!dateIsComplete || !isValidBrazilianDate(draft.date) || dateIsPast);
  const hasInvalidStartTime =
    draft.startTime.length > 0 && (!startTimeIsComplete || !isValidTime(draft.startTime));
  const hasInvalidEndTime =
    draft.endTime.length > 0 && (!endTimeIsComplete || !isValidTime(draft.endTime));
  const weekday = formatEventWeekday(draft.date);
  const duration = formatEventDuration(draft.startTime, draft.endTime);

  const canSave = useMemo(
    () =>
      draft.title.trim() !== "" &&
      draft.category.trim() !== "" &&
      isValidBrazilianDate(draft.date) &&
      !dateIsPast &&
      Boolean(draft.location?.placeId) &&
      !hasInvalidStartTime &&
      !hasInvalidEndTime,
    [
      draft.category,
      draft.date,
      draft.location?.placeId,
      draft.title,
      dateIsPast,
      hasInvalidEndTime,
      hasInvalidStartTime,
    ],
  );

  const updateStop = (index: number, value: EventPlaceReference | null) => {
    updateDraft(
      "stops",
      draft.stops.map((stop, stopIndex) => (stopIndex === index ? value : stop)),
    );
  };

  const handleSave = async () => {
    if (!canSave || isSaving) return;

    onSavingChange(true);
    try {
      await updateEvent(eventId, buildPayload());
      Toast.show({
        type: "success",
        text1: "Evento atualizado",
        text2: "As alterações foram salvas com sucesso.",
      });
      onSaved();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar evento",
        text2: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <EventEditLayout
      footer={
        <Button disabled={!canSave || isSaving} size="lg" style={styles.fullButton} onPress={handleSave}>
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
      }
      onBack={onBack}
    >
      <EventEditSection title="Informações básicas">
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
        </View>

        <EventFormField
          label="Sobre o evento"
          multiline
          numberOfLines={5}
          placeholder="Descreva o evento, o trajeto, os pontos de parada..."
          value={draft.description}
          onChangeText={(value) => updateDraft("description", value)}
        />
      </EventEditSection>

      <EventEditSection title="Data e local">
        <View>
          <EventFormField
            keyboardType="number-pad"
            label="Data *"
            maxLength={10}
            placeholder="DD/MM/AAAA"
            value={draft.date}
            onChangeText={(value) => updateDraft("date", formatBrazilianDateInput(value))}
          />
          {weekday ? <Text style={styles.helperText}>{weekday}</Text> : null}
          {hasInvalidDate ? (
            <Text style={styles.errorText}>
              {dateIsPast
                ? "Não é permitido usar data passada no evento."
                : "Informe uma data válida."}
            </Text>
          ) : null}
        </View>

        <View>
          <Text style={styles.label}>Horário</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <EventFormField
                keyboardType="number-pad"
                label="Início"
                maxLength={5}
                placeholder="07:00"
                value={draft.startTime}
                onChangeText={(value) => updateDraft("startTime", formatTimeInput(value))}
              />
              {hasInvalidStartTime ? (
                <Text style={styles.errorText}>Hora inválida.</Text>
              ) : null}
            </View>
            <View style={styles.timeField}>
              <EventFormField
                keyboardType="number-pad"
                label="Término"
                maxLength={5}
                placeholder="18:00"
                value={draft.endTime}
                onChangeText={(value) => updateDraft("endTime", formatTimeInput(value))}
              />
              {hasInvalidEndTime ? (
                <Text style={styles.errorText}>Hora inválida.</Text>
              ) : null}
            </View>
          </View>
          {duration ? <Text style={styles.helperText}>{duration}</Text> : null}
        </View>

        <EventPlaceAutocompleteField
          label="Ponto de encontro *"
          placeholder="Buscar endereço de saída..."
          value={draft.location}
          onChange={(place) => updateDraft("location", place)}
        />

        <EventPlaceAutocompleteField
          label="Destino (opcional)"
          placeholder="Buscar endereço de chegada..."
          value={draft.destination}
          onChange={(place) => updateDraft("destination", place)}
        />

        {draft.stops.map((stop, index) => (
          <View key={`stop-${index}`}>
            <View style={styles.stopRow}>
              <View style={styles.stopInput}>
                <EventPlaceAutocompleteField
                  label={`Parada ${index + 1}`}
                  placeholder="Buscar endereço da parada..."
                  value={stop}
                  onChange={(place) => updateStop(index, place)}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.removeStopButton}
                onPress={() =>
                  updateDraft(
                    "stops",
                    draft.stops.filter((_, stopIndex) => stopIndex !== index),
                  )
                }
              >
                <Ionicons color="#EF4444" name="close" size={18} />
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          style={styles.addStopButton}
          onPress={() => updateDraft("stops", [...draft.stops, null])}
        >
          <Ionicons color="#6B7280" name="add" size={18} />
          <Text style={styles.addStopText}>Adicionar ponto de parada (opcional)</Text>
        </Pressable>
      </EventEditSection>

      <EventEditSection title="Participantes e detalhes">
        <Pressable
          accessibilityRole="button"
          style={styles.toggleCard}
          onPress={() => {
            const nextValue = !draft.hasParticipantLimit;
            updateDraft("hasParticipantLimit", nextValue);
            if (!nextValue) updateDraft("maxParticipants", undefined);
          }}
        >
          <View style={styles.toggleIcon}>
            <Ionicons
              color={draft.hasParticipantLimit ? colors.brandDark : "#9CA3AF"}
              name={draft.hasParticipantLimit ? "checkmark-circle" : "ellipse-outline"}
              size={24}
            />
          </View>
          <View style={styles.toggleTextBlock}>
            <Text style={styles.toggleTitle}>Definir limite de participantes</Text>
            <Text style={styles.toggleSubtitle}>
              Ative caso o evento tenha limite de vagas.
            </Text>
          </View>
        </Pressable>

        {draft.hasParticipantLimit ? (
          <EventFormField
            keyboardType="number-pad"
            label="Máximo de pessoas"
            placeholder="Ex: 60"
            value={draft.maxParticipants ? String(draft.maxParticipants) : ""}
            onChangeText={(value) => {
              const normalized = value.replace(/\D/g, "");
              updateDraft("maxParticipants", normalized ? Number(normalized) : undefined);
            }}
          />
        ) : null}

        <EventEditableList
          items={draft.included}
          label="O que está incluído"
          placeholder="Ex: Seguro do Evento"
          onChange={(items) => updateDraft("included", items)}
        />

        <EventEditableList
          items={draft.requirements}
          label="Requisitos"
          placeholder="Ex: CNH categoria A válida"
          onChange={(items) => updateDraft("requirements", items)}
        />
      </EventEditSection>

      <EventEditSection title="Galeria de imagens">
        <EventGalleryImagePicker
          images={draft.gallery}
          onChange={(images) => updateDraft("gallery", images)}
        />
      </EventEditSection>
    </EventEditLayout>
  );
}

const styles = StyleSheet.create({
  addStopButton: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  addStopText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },
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
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  categoryText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryTextActive: {
    color: colors.brandDark,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  feedbackScreen: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  feedbackText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  fullButton: {
    width: "100%",
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  removeStopButton: {
    alignItems: "center",
    borderColor: "#FECACA",
    borderRadius: 18,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    marginTop: 27,
    width: 50,
  },
  stopInput: {
    flex: 1,
  },
  stopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  timeField: {
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  toggleCard: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  toggleIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  toggleSubtitle: {
    color: "#6B7280",
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
