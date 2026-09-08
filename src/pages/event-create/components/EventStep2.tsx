import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { EventFormField } from "./EventFormField";
import { EventPlaceAutocompleteField } from "./EventPlaceAutocompleteField";
import { EventWizardLayout } from "./EventWizardLayout";
import {
  EVENT_CREATE_TOTAL_STEPS,
  formatBrazilianDateInput,
  formatEventDuration,
  formatEventWeekday,
  formatTimeInput,
  isPastBrazilianDate,
  isValidBrazilianDate,
  isValidTime,
  validateEventPeriodFields,
} from "../services/event-create.service";
import type {
  EventDraft,
  EventDraftUpdate,
  EventPlaceReference,
} from "../types/event-create.types";

type EventStep2Props = {
  draft: EventDraft;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  updateDraft: EventDraftUpdate;
};

export function EventStep2({ draft, onBack, onClose, onNext, updateDraft }: EventStep2Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const startDateIsComplete = draft.startDate.length === 10;
  const endDateIsComplete = draft.endDate.length === 10;
  const startDateIsPast = startDateIsComplete && isPastBrazilianDate(draft.startDate);
  const startTimeIsComplete = draft.startTime.length === 5;
  const endTimeIsComplete = draft.endTime.length === 5;
  const hasInvalidStartDate =
    draft.startDate.length > 0 &&
    (!startDateIsComplete || !isValidBrazilianDate(draft.startDate) || startDateIsPast);
  const hasInvalidEndDate =
    draft.endDate.length > 0 && (!endDateIsComplete || !isValidBrazilianDate(draft.endDate));
  const hasInvalidStartTime =
    draft.startTime.length > 0 && (!startTimeIsComplete || !isValidTime(draft.startTime));
  const hasInvalidEndTime =
    draft.endTime.length > 0 && (!endTimeIsComplete || !isValidTime(draft.endTime));
  const periodError = validateEventPeriodFields(draft);
  const canAdvance =
    !periodError && Boolean(draft.location?.placeId) && !hasInvalidStartTime && !hasInvalidEndTime;
  const weekday = formatEventWeekday(draft.startDate);
  const duration = formatEventDuration(
    draft.startTime,
    draft.endTime,
    draft.startDate,
    draft.endDate,
  );

  const handleStartDateChange = (value: string) => {
    const previousStart = draft.startDate;
    const nextStart = formatBrazilianDateInput(value);
    updateDraft("startDate", nextStart);
    if (!draft.endDate || draft.endDate === previousStart) {
      updateDraft("endDate", nextStart);
    }
  };

  const handleEndDateChange = (value: string) => {
    updateDraft("endDate", formatBrazilianDateInput(value));
  };

  const handleStartTimeChange = (value: string) => {
    updateDraft("startTime", formatTimeInput(value));
  };

  const handleEndTimeChange = (value: string) => {
    updateDraft("endTime", formatTimeInput(value));
  };

  const updateStop = (index: number, value: EventPlaceReference | null) => {
    updateDraft(
      "stops",
      draft.stops.map((stop, stopIndex) => (stopIndex === index ? value : stop)),
    );
  };

  return (
    <EventWizardLayout
      step={2}
      subtitle="Data, horário e ponto de encontro do evento."
      title="Quando e onde?"
      totalSteps={EVENT_CREATE_TOTAL_STEPS}
      onClose={onClose}
    >
      <View style={styles.form}>
        <View>
          <Text style={styles.label}>Data</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <EventFormField
                keyboardType="number-pad"
                label="Início *"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                value={draft.startDate}
                onChangeText={handleStartDateChange}
              />
              {hasInvalidStartDate ? (
                <Text style={styles.errorText}>
                  {startDateIsPast
                    ? "Não é permitido criar evento em data passada."
                    : "Informe uma data válida."}
                </Text>
              ) : null}
            </View>
            <View style={styles.timeField}>
              <EventFormField
                keyboardType="number-pad"
                label="Término *"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                value={draft.endDate}
                onChangeText={handleEndDateChange}
              />
              {hasInvalidEndDate ? (
                <Text style={styles.errorText}>Informe uma data válida.</Text>
              ) : null}
            </View>
          </View>
          {weekday ? <Text style={styles.helperText}>{weekday}</Text> : null}
          {periodError &&
          !hasInvalidStartDate &&
          !hasInvalidEndDate &&
          !hasInvalidStartTime &&
          !hasInvalidEndTime ? (
            <Text style={styles.errorText}>{periodError}</Text>
          ) : null}
        </View>

        <View>
          <Text style={styles.label}>Horário</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <EventFormField
                keyboardType="number-pad"
                label="Início *"
                maxLength={5}
                placeholder="07:00"
                value={draft.startTime}
                onChangeText={handleStartTimeChange}
              />
              {hasInvalidStartTime ? (
                <Text style={styles.errorText}>Hora inválida.</Text>
              ) : null}
            </View>
            <View style={styles.timeField}>
              <EventFormField
                keyboardType="number-pad"
                label="Término *"
                maxLength={5}
                placeholder="18:00"
                value={draft.endTime}
                onChangeText={handleEndTimeChange}
              />
              {hasInvalidEndTime ? <Text style={styles.errorText}>Hora inválida.</Text> : null}
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
          <View key={index}>
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
                <Ionicons color={colors.feedback.danger} name="close" size={18} />
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          style={styles.addStopButton}
          onPress={() => updateDraft("stops", [...draft.stops, null])}
        >
          <Ionicons color={colors.text.secondary} name="add" size={18} />
          <Text style={styles.addStopText}>Adicionar ponto de parada (opcional)</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Button disabled={!canAdvance} size="lg" style={styles.fullButton} onPress={onNext}>
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
  addStopButton: {
    alignItems: "center",
    borderColor: colors.border.default,
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
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    gap: 12,
    marginTop: 28,
  },
  errorText: {
    color: colors.feedback.danger,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  form: {
    gap: 20,
  },
  fullButton: {
    width: "100%",
  },
  helperText: {
    color: colors.text.secondary,
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
    borderColor: colors.feedback.dangerBorder,
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
});
