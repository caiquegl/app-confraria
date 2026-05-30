import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { fetchLatestTerm } from "../services/wizard.service";
import type { LgpdTermsModalProps, Term } from "../types/wizard.types";

export function LgpdTermsModal({ onClose, visible }: LgpdTermsModalProps) {
  const insets = useSafeAreaInsets();
  const [term, setTerm] = useState<Term | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setTerm(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchLatestTerm()
      .then(setTerm)
      .catch(() => setError("Não foi possível carregar os termos. Tente novamente."))
      .finally(() => setIsLoading(false));
  }, [visible]);

  const bottomPadding = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0) + 24;

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: bottomPadding }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{term?.title ?? "Termos LGPD"}</Text>
            <TouchableOpacity activeOpacity={0.65} hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.brandDark} name="close" size={24} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.brandGreen} size="large" />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.content}>{term?.content}</Text>
            </ScrollView>
          )}

          <Button size="lg" style={styles.button} onPress={onClose}>
            Entendi
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  button: {
    marginTop: 16,
    width: "100%",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginBottom: 8,
    maxHeight: "80%",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  content: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
  },
  error: {
    color: "#EF4444",
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: 24,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  scroll: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  title: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    marginRight: 12,
  },
});
