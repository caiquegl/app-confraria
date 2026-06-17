import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { EventPlaceAutocompleteField } from "@/pages/event-create/components/EventPlaceAutocompleteField";
import {
  formatTimeInput,
  isValidTime,
} from "@/pages/event-create/services/event-create.service";
import type { EventPlaceReference } from "@/pages/event-create/types/event-create.types";
import {
  buildQuickRideStartsAt,
  fetchQuickRideDetail,
  isQuickRideTimePast,
  mapQuickRidePlaceToReference,
  parseQuickRideSchedule,
  updateQuickRide,
  type QuickRideDay,
} from "@/pages/quick-rides/services/quick-rides.service";
import { colors } from "@/theme/colors";

type QuickRideEditViewProps = {
  onBack: () => void;
  onSaved: () => void;
  quickRideId: string;
};

export function QuickRideEditView({ onBack, onSaved, quickRideId }: QuickRideEditViewProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [origin, setOrigin] = useState<EventPlaceReference | null>(null);
  const [destination, setDestination] = useState<EventPlaceReference | null>(null);
  const [day, setDay] = useState<QuickRideDay>("today");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [hasLimit, setHasLimit] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("8");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRide = useCallback(async () => {
    if (!quickRideId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    try {
      const ride = await fetchQuickRideDetail(quickRideId);
      const schedule = parseQuickRideSchedule(ride.startsAt);

      setTitle(ride.title);
      setOrigin(mapQuickRidePlaceToReference(ride.origin));
      setDestination(mapQuickRidePlaceToReference(ride.destination));
      setDay(schedule.day);
      setTime(schedule.time);
      setDescription(ride.description ?? "");
      setHasLimit(ride.maxParticipants != null);
      setMaxParticipants(
        ride.maxParticipants != null ? String(ride.maxParticipants) : "8",
      );
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [quickRideId]);

  useFocusEffect(
    useCallback(() => {
      void loadRide();
    }, [loadRide]),
  );

  const timeIsComplete = time.length === 5;
  const timeIsValid = isValidTime(time);
  const timeIsPast = timeIsValid && isQuickRideTimePast(day, time);
  const hasInvalidTime = time.length > 0 && (!timeIsComplete || !timeIsValid);
  const startsAt = timeIsValid ? buildQuickRideStartsAt(day, time) : "";
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    Boolean(origin?.placeId) &&
    Boolean(destination?.placeId) &&
    timeIsValid &&
    !timeIsPast &&
    !isSubmitting &&
    !isLoading;

  const handleSubmit = async () => {
    if (!origin || !destination || !timeIsValid || !startsAt || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const parsedLimit = Number(maxParticipants);
      await updateQuickRide(quickRideId, {
        title: title.trim(),
        description: description.trim(),
        origin,
        destination,
        startsAt,
        maxParticipants: hasLimit
          ? Number.isFinite(parsedLimit) && parsedLimit > 0
            ? parsedLimit
            : 1
          : undefined,
      });

      Toast.show({
        type: "success",
        text1: "Rolê atualizado!",
      });
      onSaved();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Não foi possível atualizar o rolê",
        text2: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar rolê</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : null}

      {!isLoading && hasError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Não foi possível carregar este rolê.</Text>
        </View>
      ) : null}

      {!isLoading && !hasError ? (
        <>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 96 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.field}>
                <Text style={styles.label}>Nome do rolê *</Text>
                <TextInput
                  placeholder="Tô indo pra Pedra Grande"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.field}>
                <EventPlaceAutocompleteField
                  label="De onde"
                  placeholder="Buscar origem..."
                  required
                  value={origin}
                  onChange={setOrigin}
                />
              </View>

              <View style={styles.field}>
                <EventPlaceAutocompleteField
                  label="Pra onde"
                  placeholder="Buscar destino..."
                  required
                  value={destination}
                  onChange={setDestination}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Quando</Text>
                <View style={styles.dayRow}>
                  {(["today", "tomorrow"] as const).map((option) => {
                    const selected = day === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        style={[styles.dayChip, selected && styles.dayChipSelected]}
                        onPress={() => setDay(option)}
                      >
                        <Text
                          style={[styles.dayChipText, selected && styles.dayChipTextSelected]}
                        >
                          {option === "today" ? "Hoje" : "Amanhã"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  keyboardType="numbers-and-punctuation"
                  placeholder="HH:MM"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={time}
                  onChangeText={(value) => setTime(formatTimeInput(value))}
                />
                {hasInvalidTime ? (
                  <Text style={styles.fieldError}>Informe um horário válido (HH:MM).</Text>
                ) : null}
                {timeIsPast ? (
                  <Text style={styles.fieldError}>
                    Esse horário já passou. Escolha um horário à frente.
                  </Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Descrição *</Text>
                <TextInput
                  multiline
                  placeholder="Galera, bora de bate-volta? Parada pra café no caminho."
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, styles.textArea]}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {!hasLimit ? (
                <Pressable accessibilityRole="button" onPress={() => setHasLimit(true)}>
                  <Text style={styles.addLimitText}>+ Adicionar limite de gente</Text>
                </Pressable>
              ) : (
                <View style={styles.field}>
                  <Text style={styles.label}>Limite de gente</Text>
                  <TextInput
                    keyboardType="number-pad"
                    style={styles.input}
                    value={maxParticipants}
                    onChangeText={(value) => {
                      if (value === "") {
                        setMaxParticipants("");
                        return;
                      }
                      const parsed = Math.max(1, Number(value));
                      setMaxParticipants(Number.isFinite(parsed) ? String(parsed) : "1");
                    }}
                  />
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Button
              disabled={!canSubmit}
              size="lg"
              style={styles.submitButton}
              onPress={() => void handleSubmit()}
            >
              Salvar alterações
            </Button>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addLimitText: {
    color: colors.brandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dayChip: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  dayChipSelected: {
    backgroundColor: colors.brandGreen,
  },
  dayChipText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "700",
  },
  dayChipTextSelected: {
    color: colors.brandDark,
  },
  dayRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  errorText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  field: {
    gap: 6,
  },
  fieldError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  flex: {
    flex: 1,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  submitButton: {
    width: "100%",
  },
  textArea: {
    minHeight: 96,
  },
});
