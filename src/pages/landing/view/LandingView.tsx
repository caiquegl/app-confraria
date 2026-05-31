import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { useApiEnvironment } from "@/hooks/useApiEnvironment";
import { ConfraLogo } from "@/pages/loading";
import { colors } from "@/theme/colors";

import { useLanding } from "../business/useLanding";
import { SocialButtons } from "../components/SocialButtons";
import { WelcomeModal } from "../components/WelcomeModal";
import type { LandingViewProps } from "../types/landing.types";

export function LandingView({ onLogin, onRegister }: LandingViewProps) {
  const { handleModalContinue, isReady, modalVisible } = useLanding();
  const { toggleEnvironment } = useApiEnvironment();

  const handleLogoLongPress = async () => {
    const next = await toggleEnvironment();

    Toast.show({
      type: next === "homolog" ? "error" : "success",
      text1: `Ambiente alterado para ${next === "homolog" ? "Homolog" : "Produção"}`,
      text2: next === "homolog" ? "Usando API local de homologação." : "Usando API de produção.",
      visibilityTime: 3000,
    });
  };

  if (!isReady) return null;

  return (
    <View style={styles.screen}>
      <WelcomeModal visible={modalVisible} onContinue={handleModalContinue} />

      <Pressable
        style={styles.logoRow}
        delayLongPress={900}
        onLongPress={handleLogoLongPress}
      >
        <ConfraLogo />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.tag}>Faça parte do Confraria®</Text>
          <Text style={styles.headline}>{"Liberdade\nse compartilha"}</Text>
          <Text style={styles.sub}>
            Descubra rotas, rolês e eventos de motociclismo perto de você.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button size="lg" style={styles.fullWidth} onPress={onLogin}>
            Entrar
          </Button>
          <Button
            variant="secondary"
            size="lg"
            style={styles.fullWidth}
            onPress={onRegister}
          >
            Criar conta
          </Button>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.socialLabel}>Acesso rápido</Text>
          <SocialButtons />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Interface simplificada para focar apenas no acesso.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  body: {
    flex: 1,
    gap: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  footer: {
    paddingBottom: 16,
    paddingTop: 24,
  },
  footerText: {
    color: `${colors.brandDark}8C`,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  fullWidth: {
    width: "100%",
  },
  headline: {
    color: colors.brandDark,
    fontSize: 40,
    fontWeight: "700",
    lineHeight: 48,
    marginBottom: 12,
    textAlign: "center",
  },
  hero: {
    marginBottom: 40,
  },
  logoRow: {
    alignItems: "center",
    paddingTop: 8,
    marginTop: 60,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingVertical: 40,
  },
  socialLabel: {
    color: `${colors.brandDark}8C`,
    fontSize: 14,
    marginBottom: 0,
    textAlign: "center",
  },
  socialSection: {
    borderTopColor: "rgba(0,0,0,0.08)",
    borderTopWidth: 1,
    gap: 0,
    marginTop: 32,
    paddingTop: 24,
  },
  sub: {
    color: `${colors.brandDark}AD`,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  tag: {
    color: `${colors.brandDark}99`,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "center",
  },
});
