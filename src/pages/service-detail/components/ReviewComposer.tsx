import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@/theme/colors";
import type { ServiceReview } from "@/pages/services/types/services.types";

import { StarRating } from "./StarRating";

type ReviewComposerProps = {
  myReview: ServiceReview | null;
  isSubmitting: boolean;
  onSubmit: (rating: number, comment: string) => void;
  onDelete: () => void;
};

export function ReviewComposer({
  myReview,
  isSubmitting,
  onSubmit,
  onDelete,
}: ReviewComposerProps) {
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [comment, setComment] = useState(myReview?.comment ?? "");

  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
  }, [myReview]);

  const canSubmit = rating >= 1 && rating <= 5 && !isSubmitting;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {myReview ? "Sua avaliação" : "Avaliar este serviço"}
      </Text>

      <StarRating editable size={28} value={rating} onChange={setRating} />

      <TextInput
        multiline
        maxLength={500}
        placeholder="Conte como foi sua experiência (opcional)"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={comment}
        onChangeText={setComment}
      />

      <View style={styles.actions}>
        {myReview ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            style={styles.deleteButton}
            onPress={onDelete}
          >
            <Text style={styles.deleteText}>Remover</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          onPress={() => onSubmit(rating, comment.trim())}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.brandDark} size="small" />
          ) : (
            <Text style={styles.submitText}>
              {myReview ? "Atualizar" : "Enviar avaliação"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 14,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 14,
    minHeight: 80,
    padding: 12,
    textAlignVertical: "top",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    minWidth: 150,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
  },
});
