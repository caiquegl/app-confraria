import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { EventFormField } from "./EventFormField";
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
} from "../services/event-create.service";
import type { EventDraft, EventDraftUpdate } from "../types/event-create.types";

type EventStep2Props = {
  draft: EventDraft;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  updateDraft: EventDraftUpdate;
};

export function EventStep2({ draft, onBack, onClose, onNext, updateDraft }: EventStep2Props) {
  const dateIsComplete = draft.date.length === 10;
  const dateIsPast = dateIsComplete && isPastBrazilianDate(draft.date);
  const startTimeIsComplete = draft.startTime.length === 5;
  const endTimeIsComplete = draft.endTime.length === 5;
  const hasInvalidDate =
    draft.date.length > 0 && (!dateIsComplete || !isValidBrazilianDate(draft.date) || dateIsPast);
  const hasInvalidStartTime =
    draft.startTime.length > 0 && (!startTimeIsComplete || !isValidTime(draft.startTime));
  const hasInvalidEndTime =
    draft.endTime.length > 0 && (!endTimeIsComplete || !isValidTime(draft.endTime));
  const canAdvance =
    isValidBrazilianDate(draft.date) &&
    !dateIsPast &&
    draft.location.trim() !== "" &&
    !hasInvalidStartTime &&
    !hasInvalidEndTime;
  const weekday = formatEventWeekday(draft.date);
  const duration = formatEventDuration(draft.startTime, draft.endTime);

  const handleDateChange = (value: string) => {
    updateDraft("date", formatBrazilianDateInput(value));
  };

  const handleStartTimeChange = (value: string) => {
    updateDraft("startTime", formatTimeInput(value));
  };

  const handleEndTimeChange = (value: string) => {
    updateDraft("endTime", formatTimeInput(value));
  };

  const updateStop = (index: number, value: string) => {
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
          <EventFormField
            keyboardType="number-pad"
            label="Data *"
            maxLength={10}
            placeholder="DD/MM/AAAA"
            value={draft.date}
            onChangeText={handleDateChange}
          />
          {weekday ? <Text style={styles.helperText}>{weekday}</Text> : null}
          {hasInvalidDate ? (
            <Text style={styles.errorText}>
              {dateIsPast ? "Não é permitido criar evento em data passada." : "Informe uma data válida."}
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
                onChangeText={handleStartTimeChange}
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
                onChangeText={handleEndTimeChange}
              />
              {hasInvalidEndTime ? <Text style={styles.errorText}>Hora inválida.</Text> : null}
            </View>
          </View>
          {duration ? <Text style={styles.helperText}>{duration}</Text> : null}
        </View>

        <EventFormField
          label="Ponto de encontro *"
          placeholder="Buscar endereço de saída..."
          value={draft.location}
          onChangeText={(value) => updateDraft("location", value)}
        />

        <EventFormField
          label="Destino (opcional)"
          placeholder="Buscar endereço de chegada..."
          value={draft.destination}
          onChangeText={(value) => updateDraft("destination", value)}
        />

        {draft.stops.map((stop, index) => (
          <View key={index}>
            <Text style={styles.label}>Parada {index + 1}</Text>
            <View style={styles.stopRow}>
              <View style={styles.stopInput}>
                <EventFormField
                  label=""
                  placeholder="Buscar endereço da parada..."
                  value={stop}
                  onChangeText={(value) => updateStop(index, value)}
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
          onPress={() => updateDraft("stops", [...draft.stops, ""])}
        >
          <Ionicons color="#6B7280" name="add" size={18} />
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
  footer: {
    gap: 12,
    marginTop: 28,
  },
  errorText: {
    color: "#EF4444",
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
    marginTop: 0,
    width: 50,
  },
  stopInput: {
    flex: 1,
  },
  stopRow: {
    alignItems: "flex-end",
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
