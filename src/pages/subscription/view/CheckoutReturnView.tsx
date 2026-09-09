import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { fetchSubscriptionMe } from "../services/subscription.service";

type CheckoutReturnViewProps = {
  kind: "success" | "cancel";
};

const VIP_POLL_ATTEMPTS = 5;
const VIP_POLL_MS = 1500;

export function CheckoutReturnView({ kind }: CheckoutReturnViewProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [isConfirming, setIsConfirming] = useState(kind === "success");
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    if (kind !== "success") return;

    let cancelled = false;

    void (async () => {
      for (let attempt = 0; attempt < VIP_POLL_ATTEMPTS; attempt += 1) {
        try {
          const data = await fetchSubscriptionMe();
          if (cancelled) return;
          if (data.isVip) {
            setIsVip(true);
            setIsConfirming(false);
            return;
          }
        } catch {
          // Keep polling; webhook may still be processing.
        }

        if (attempt < VIP_POLL_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, VIP_POLL_MS));
          if (cancelled) return;
        }
      }

      if (!cancelled) setIsConfirming(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [kind]);

  const goToSubscription = () => {
    router.replace("/profile/subscription" as Href);
  };

  if (kind === "cancel") {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.brandDark} name="close-circle-outline" size={36} />
        </View>
        <Text style={styles.title}>Checkout cancelado</Text>
        <Text style={styles.description}>
          Nenhuma cobrança foi feita. Você pode tentar de novo quando quiser.
        </Text>
        <Button size="lg" style={styles.button} onPress={goToSubscription}>
          Voltar para assinatura
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.iconWrap}>
        {isConfirming ? (
          <ActivityIndicator color={colors.brandDark} size="large" />
        ) : (
          <Ionicons
            color={colors.brandDark}
            name={isVip ? "checkmark-circle" : "time-outline"}
            size={36}
          />
        )}
      </View>
      <Text style={styles.title}>
        {isConfirming
          ? "Confirmando pagamento..."
          : isVip
            ? "Pagamento confirmado"
            : "Pagamento recebido"}
      </Text>
      <Text style={styles.description}>
        {isConfirming
          ? "Estamos ativando seu VIP. Isso costuma levar só alguns segundos."
          : isVip
            ? "Seu selo verificado já está ativo. Aproveite os benefícios Premium."
            : "Se o pagamento foi aprovado, o VIP aparece em instantes na tela de assinatura."}
      </Text>
      <Button
        disabled={isConfirming}
        size="lg"
        style={styles.button}
        onPress={goToSubscription}
      >
        Ver minha assinatura
      </Button>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  button: {
    marginTop: 28,
    width: "100%",
  },
  description: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  iconWrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    marginBottom: 20,
    width: 72,
  },
  screen: {
    backgroundColor: colors.surface.primary,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
});
