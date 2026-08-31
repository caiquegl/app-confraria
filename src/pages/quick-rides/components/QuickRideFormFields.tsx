import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { InputField } from "@/components/InputField";
import { EventPlaceAutocompleteField } from "@/pages/event-create/components/EventPlaceAutocompleteField";
import { formatTimeInput } from "@/pages/event-create/services/event-create.service";
import type { EventPlaceReference } from "@/pages/event-create/types/event-create.types";
import { colors } from "@/theme/colors";

import {
  getQuickRideTimeError,
  getRequiredTextError,
  normalizeMaxParticipantsInput,
  QUICK_RIDE_FIELD,
} from "../lib/quick-ride-form";
import type { QuickRideDay } from "../services/quick-rides.service";

type QuickRideFormFieldsProps = {
  day: QuickRideDay;
  description: string;
  destination: EventPlaceReference | null;
  disabled?: boolean;
  hasLimit: boolean;
  maxParticipants: string;
  origin: EventPlaceReference | null;
  time: string;
  title: string;
  onDayChange: (day: QuickRideDay) => void;
  onDescriptionChange: (value: string) => void;
  onDestinationChange: (value: EventPlaceReference | null) => void;
  onHasLimitChange: (value: boolean) => void;
  onMaxParticipantsChange: (value: string) => void;
  onOriginChange: (value: EventPlaceReference | null) => void;
  onTimeChange: (value: string) => void;
  onTitleChange: (value: string) => void;
};

export function QuickRideFormFields({
  day,
  description,
  destination,
  disabled = false,
  hasLimit,
  maxParticipants,
  origin,
  time,
  title,
  onDayChange,
  onDescriptionChange,
  onDestinationChange,
  onHasLimitChange,
  onMaxParticipantsChange,
  onOriginChange,
  onTimeChange,
  onTitleChange,
}: QuickRideFormFieldsProps) {
  const timeRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const maxParticipantsRef = useRef<TextInput>(null);
  const [touched, setTouched] = useState({ description: false, title: false });

  const titleError = touched.title
    ? getRequiredTextError(title, "Informe o nome do rolê.")
    : undefined;
  const descriptionError = touched.description
    ? getRequiredTextError(description, "Informe a descrição do rolê.")
    : undefined;
  const timeError = getQuickRideTimeError(day, time);

  return (
    <>
      <InputField
        autoCapitalize={QUICK_RIDE_FIELD.title.autoCapitalize}
        blurOnSubmit={false}
        editable={!disabled}
        error={titleError}
        label={QUICK_RIDE_FIELD.title.label}
        persistentLabel
        placeholder={QUICK_RIDE_FIELD.title.placeholder}
        required={QUICK_RIDE_FIELD.title.required}
        returnKeyType={QUICK_RIDE_FIELD.title.returnKeyType}
        value={title}
        onBlur={() => setTouched((current) => ({ ...current, title: true }))}
        onChangeText={onTitleChange}
        onSubmitEditing={() => timeRef.current?.focus()}
      />

      <EventPlaceAutocompleteField
        label="De onde"
        placeholder="Buscar origem..."
        required
        value={origin}
        onChange={onOriginChange}
      />

      <EventPlaceAutocompleteField
        label="Pra onde"
        placeholder="Buscar destino..."
        required
        value={destination}
        onChange={onDestinationChange}
      />

      <View style={styles.whenField}>
        <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.whenLabel}>
          Quando
        </Text>
        <View style={styles.dayRow}>
          {(["today", "tomorrow"] as const).map((option) => {
            const selected = day === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={disabled}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
                onPress={() => onDayChange(option)}
              >
                <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                  {option === "today" ? "Hoje" : "Amanhã"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <InputField
          ref={timeRef}
          blurOnSubmit={false}
          editable={!disabled}
          error={timeError}
          helperText={timeError ? undefined : QUICK_RIDE_FIELD.time.helperText}
          keyboardType={QUICK_RIDE_FIELD.time.keyboardType}
          label={QUICK_RIDE_FIELD.time.label}
          persistentLabel
          placeholder={QUICK_RIDE_FIELD.time.placeholder}
          required={QUICK_RIDE_FIELD.time.required}
          returnKeyType={QUICK_RIDE_FIELD.time.returnKeyType}
          value={time}
          onChangeText={(value) => onTimeChange(formatTimeInput(value))}
          onSubmitEditing={() => descriptionRef.current?.focus()}
        />
      </View>

      <InputField
        ref={descriptionRef}
        autoCapitalize={QUICK_RIDE_FIELD.description.autoCapitalize}
        editable={!disabled}
        error={descriptionError}
        helperText={descriptionError ? undefined : QUICK_RIDE_FIELD.description.helperText}
        label={QUICK_RIDE_FIELD.description.label}
        multiline
        persistentLabel
        placeholder={QUICK_RIDE_FIELD.description.placeholder}
        required={QUICK_RIDE_FIELD.description.required}
        value={description}
        onBlur={() => setTouched((current) => ({ ...current, description: true }))}
        onChangeText={onDescriptionChange}
      />

      {!hasLimit ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onHasLimitChange(true)}
        >
          <Text style={styles.addLimitText}>+ Adicionar limite de gente</Text>
        </Pressable>
      ) : (
        <InputField
          ref={maxParticipantsRef}
          editable={!disabled}
          helperText={QUICK_RIDE_FIELD.maxParticipants.helperText}
          keyboardType={QUICK_RIDE_FIELD.maxParticipants.keyboardType}
          label={QUICK_RIDE_FIELD.maxParticipants.label}
          persistentLabel
          returnKeyType={QUICK_RIDE_FIELD.maxParticipants.returnKeyType}
          value={maxParticipants}
          onChangeText={(value) => onMaxParticipantsChange(normalizeMaxParticipantsInput(value))}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addLimitText: {
    color: colors.brandPrimary,
    fontSize: 14,
    fontWeight: "700",
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
  whenField: {
    gap: 6,
  },
  whenLabel: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
});
