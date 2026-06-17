import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
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
import { colors } from "@/theme/colors";

import {
  buildQuickRideStartsAt,
  createQuickRide,
  isQuickRideTimePast,
} from "@/pages/quick-rides/services/quick-rides.service";

type QuickRideDay = "today" | "tomorrow";

export function QuickRideCreateView() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [origin, setOrigin] = useState<EventPlaceReference | null>(null);
  const [destination, setDestination] = useState<EventPlaceReference | null>(null);
  const [day, setDay] = useState<QuickRideDay>("today");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [hasLimit, setHasLimit] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("8");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeIsComplete = time.length === 5;
  const timeIsValid = isValidTime(time);
  const timeIsPast = timeIsValid && isQuickRideTimePast(day, time);
  const hasInvalidTime =
    time.length > 0 && (!timeIsComplete || !timeIsValid);

  const handleDayChange = (nextDay: QuickRideDay) => {
    setDay(nextDay);
  };

  const handleTimeChange = (value: string) => {
    setTime(formatTimeInput(value));
  };

  const startsAt = timeIsValid ? buildQuickRideStartsAt(day, time) : "";
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    Boolean(origin?.placeId) &&
    Boolean(destination?.placeId) &&
    timeIsValid &&
    !timeIsPast &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!origin || !destination || !timeIsValid || !startsAt) return;

    if (isQuickRideTimePast(day, time)) {
      return;
    }

    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const parsedLimit = Number(maxParticipants);
      await createQuickRide({
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
        text1: "Rolê criado!",
        text2: "A galera já pode ver seu convite.",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Não foi possível criar o rolê",
        text2: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Rolê rápido</Text>
      </View>

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
                    onPress={() => handleDayChange(option)}
                  >
                    <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
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
              onChangeText={handleTimeChange}
            />
            {hasInvalidTime ? (
              <Text style={styles.errorText}>Informe um horário válido (HH:MM).</Text>
            ) : null}
            {timeIsPast ? (
              <Text style={styles.errorText}>
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
        <Button disabled={!canSubmit} size="lg" style={styles.submitButton} onPress={() => void handleSubmit()}>
          Chamar a galera
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addLimitText: {
    color: colors.brandPrimary,
    fontSize: 14,
    fontWeight: "700",
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
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  field: {
    gap: 6,
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
