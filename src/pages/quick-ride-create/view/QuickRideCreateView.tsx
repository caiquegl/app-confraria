import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
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
  buildQuickRideStartsAt,
  createQuickRide,
  isQuickRideTimePast,
} from "@/pages/quick-rides/services/quick-rides.service";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type QuickRideDay = "today" | "tomorrow";

export function QuickRideCreateView() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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

  const timeIsValid = isValidTime(time);
  const timeIsPast = timeIsValid && isQuickRideTimePast(day, time);
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

    Keyboard.dismiss();
    setIsSubmitting(true);
    try {
      await createQuickRide({
        title: title.trim(),
        description: description.trim(),
        origin,
        destination,
        startsAt,
        maxParticipants: resolveMaxParticipants(hasLimit, maxParticipants),
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
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Rolê rápido</Text>
      </View>

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
        <Button disabled={!canSubmit} size="lg" style={styles.submitButton} onPress={() => void handleSubmit()}>
          Chamar a galera
        </Button>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  content: {
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  flex: {
    flex: 1,
  },
  footer: {
    backgroundColor: colors.surface.primary,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderBottomColor: colors.border.subtle,
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
  screen: {
    backgroundColor: colors.surface.primary,
    flex: 1,
  },
  submitButton: {
    width: "100%",
  },
});
