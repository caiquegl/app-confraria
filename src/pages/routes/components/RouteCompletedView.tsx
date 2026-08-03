import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { getApiErrorMessage } from "@/lib/password-reset";
import { colors } from "@/theme/colors";

import { formatRouteDistance } from "../utils/route-format.utils";
import { formatDurationFromSeconds } from "../utils/navigation-geometry.utils";

type RouteCompletedViewProps = {
  distanceMeters: number;
  durationSeconds: number;
  onClose: () => void;
  onSubmitRating: (rating: number, comment: string) => Promise<void>;
};

export function RouteCompletedView({
  distanceMeters,
  durationSeconds,
  onClose,
  onSubmitRating,
}: RouteCompletedViewProps) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitRating(rating, comment.trim());
      setIsSubmitted(true);
      Toast.show({
        text1: "Avaliação registrada",
        type: "success",
      });
    } catch (error) {
      Toast.show({
        text1: "Não foi possível salvar a avaliação",
        text2: getApiErrorMessage(error, "Verifique a conexão e tente novamente."),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <View style={[styles.screen, { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 }]}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.brandDark} name="checkmark-circle" size={48} />
        </View>
        <Text style={styles.title}>Avaliação registrada!</Text>
        <Text style={styles.subtitle}>Obrigado por compartilhar como foi a sua rota.</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              color={rating >= star ? colors.brandGreen : "#4B5563"}
              name={rating >= star ? "star" : "star-outline"}
              size={28}
            />
          ))}
        </View>
        <Button size="lg" style={styles.primaryButton} onPress={onClose}>
          Voltar para Início
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 }]}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.brandDark} name="flag" size={48} />
      </View>
      <Text style={styles.title}>Chegamos!</Text>
      <Text style={styles.subtitle}>Como foi essa rota?</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Ionicons
              color={rating >= star ? colors.brandGreen : "#4B5563"}
              name={rating >= star ? "star" : "star-outline"}
              size={32}
            />
          </Pressable>
        ))}
      </View>

      <TextInput
        multiline
        placeholder="Conte como foi a rota (opcional)"
        placeholderTextColor="#6B7280"
        style={styles.commentInput}
        value={comment}
        onChangeText={setComment}
      />

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Distância</Text>
          <Text style={styles.statValue}>{formatRouteDistance(distanceMeters)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tempo</Text>
          <Text style={styles.statValue}>{formatDurationFromSeconds(durationSeconds)}</Text>
        </View>
      </View>

      <Button
        disabled={rating === 0 || isSubmitting}
        size="lg"
        style={styles.primaryButton}
        onPress={() => void handleSubmit()}
      >
        {isSubmitting ? "Salvando..." : "Avaliar e salvar"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  commentInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    color: "#FFFFFF",
    marginTop: 20,
    minHeight: 96,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlignVertical: "top",
    width: "100%",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 96,
    justifyContent: "center",
    marginBottom: 24,
    width: 96,
  },
  primaryButton: {
    marginTop: 24,
    width: "100%",
  },
  screen: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    flex: 1,
    paddingHorizontal: 24,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
});
