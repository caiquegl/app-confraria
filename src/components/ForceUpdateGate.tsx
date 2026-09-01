import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Modal, Platform, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { fetchAppVersionPolicy } from "@/lib/app-version-policy";
import {
  evaluateForceUpdate,
  getClientOtaChannel,
  type ForceUpdateDecision,
} from "@/lib/force-update";
import { checkAndDownloadUpdate } from "@/lib/updates";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

export function ForceUpdateGate() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [decision, setDecision] = useState<ForceUpdateDecision | null>(null);

  const checkPolicy = useCallback(async () => {
    if (__DEV__ || Platform.OS === "web") {
      setDecision(null);
      return;
    }

    try {
      const policy = await fetchAppVersionPolicy(getClientOtaChannel());
      const next = evaluateForceUpdate(policy);
      setDecision(next);

      if (next?.kind === "ota") {
        void checkAndDownloadUpdate();
      }
    } catch {
      setDecision(null);
    }
  }, []);

  useEffect(() => {
    void checkPolicy();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void checkPolicy();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPolicy]);

  if (!decision) {
    return null;
  }

  const isStore = decision.kind === "store";

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {isStore ? "Atualize o aplicativo" : "Nova versão disponível"}
          </Text>
          <Text style={styles.message}>{decision.message}</Text>
          {isStore && decision.storeUrl ? (
            <Button
              onPress={() => {
                void Linking.openURL(decision.storeUrl as string);
              }}
            >
              Atualizar na loja
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(28, 33, 38, 0.72)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: 24,
    gap: 16,
    maxWidth: 400,
    padding: 24,
    width: "100%",
  },
  message: {
    color: colors.text.comment,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "800",
  },
});
