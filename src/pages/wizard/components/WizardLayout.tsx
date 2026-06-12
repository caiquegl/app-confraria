import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { colors } from "@/theme/colors";

import { LgpdTermsModal } from "./LgpdTermsModal";

type WizardLayoutProps = {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const TOTAL_STEPS = 5;

export function WizardLayout({ children, step, subtitle, title }: WizardLayoutProps) {
  const [lgpdModalVisible, setLgpdModalVisible] = useState(false);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <Logo width={80} height={40} />
          </View>

          <Text style={styles.stepLabel}>Etapa {step} de {TOTAL_STEPS}</Text>
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          <View style={styles.content}>{children}</View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Todos os seus dados são protegidos pela LGPD -{" "}
            </Text>
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={() => setLgpdModalVisible(true)}
            >
              <Text style={styles.footerLink}>Ficou com dúvida? Toque aqui!</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LgpdTermsModal visible={lgpdModalVisible} onClose={() => setLgpdModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 24,
    paddingBottom: 44,
  },
  footerLink: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  logoRow: {
    alignItems: "center",
    paddingBottom: 16,
    paddingTop: 32,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  stepLabel: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  titleBlock: {
    marginBottom: 24,
  },
});
