import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { isValidTime } from "@/pages/event-create/services/event-create.service";
import type { EventPlaceReference } from "@/pages/event-create/types/event-create.types";
import { QuickRideFormFields } from "@/pages/quick-rides/components/QuickRideFormFields";
import { resolveMaxParticipants } from "@/pages/quick-rides/lib/quick-ride-form";
import {
  fetchQuickRideDetail,
  isQuickRideTimePast,
  mapQuickRidePlaceToReference,
  parseQuickRideSchedule,
  resolveQuickRideStartsAt,
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
  const [originalStartsAt, setOriginalStartsAt] = useState("");
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
      setOriginalStartsAt(ride.startsAt);
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

  useEffect(() => {
    void loadRide();
  }, [loadRide]);

  const timeIsValid = isValidTime(time);
  const startsAt = timeIsValid ? resolveQuickRideStartsAt(day, time, originalStartsAt) : "";
  const keepingOriginalSchedule = Boolean(originalStartsAt) && startsAt === originalStartsAt;
  const timeIsPast =
    timeIsValid && isQuickRideTimePast(day, time) && !keepingOriginalSchedule;
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

    Keyboard.dismiss();
    setIsSubmitting(true);
    try {
      await updateQuickRide(quickRideId, {
        title: title.trim(),
        description: description.trim(),
        origin,
        destination,
        startsAt,
        maxParticipants: resolveMaxParticipants(hasLimit, maxParticipants),
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
      <View style={[styles.header, { paddingTop: 8 }]}>
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
          <KeyboardAwareScrollView
            bottomOffset={24}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, 16) + 96 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.flex}
          >
            <QuickRideFormFields
              day={day}
              description={description}
              destination={destination}
              disabled={isSubmitting}
              hasLimit={hasLimit}
              maxParticipants={maxParticipants}
              origin={origin}
              time={time}
              title={title}
              onDayChange={setDay}
              onDescriptionChange={setDescription}
              onDestinationChange={setDestination}
              onHasLimitChange={setHasLimit}
              onMaxParticipantsChange={setMaxParticipants}
              onOriginChange={setOrigin}
              onTimeChange={setTime}
              onTitleChange={setTitle}
            />
          </KeyboardAwareScrollView>

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
  errorText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
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
  screen: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  submitButton: {
    width: "100%",
  },
});
