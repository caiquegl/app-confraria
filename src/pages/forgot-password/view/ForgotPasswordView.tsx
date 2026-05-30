import { Controller } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { InputField } from "@/components/InputField";
import { Logo } from "@/components/Logo";
import { colors } from "@/theme/colors";

import { useForgotPassword } from "../business/useForgotPassword";
import type { ForgotPasswordViewProps } from "../types/forgot-password.types";

export function ForgotPasswordView({ onBack }: ForgotPasswordViewProps) {
  const { control, errors, handleSubmit, isSubmitting, onSubmit } = useForgotPassword();

  return (
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
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <Logo width={96} height={48} />
          </View>

          <View style={styles.header}>
            <Text style={styles.tag}>Recuperar acesso</Text>
            <Text style={styles.title}>Esqueci minha senha</Text>
            <Text style={styles.subtitle}>
              Informe seu e-mail e enviaremos instruções para redefinir sua senha.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <InputField
                  autoComplete="email"
                  error={errors.email?.message}
                  keyboardType="email-address"
                  label="Email"
                  returnKeyType="done"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onClear={() => onChange("")}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <Button
              disabled={isSubmitting}
              size="lg"
              style={styles.fullWidth}
              onPress={handleSubmit(onSubmit)}
            >
              {isSubmitting ? "Enviando..." : "Enviar instruções"}
            </Button>

            <Button
              disabled={isSubmitting}
              size="lg"
              style={styles.backButton}
              variant="secondary"
              onPress={onBack}
            >
              Voltar
            </Button>
          </View>
        </View>

        <Text style={styles.footer}>Seus dados seguem protegidos pela LGPD.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginTop: 16,
    width: "100%",
  },
  card: {
    backgroundColor: "rgba(255,255,255)",
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 28,
    borderWidth: 1,
    elevation: 8,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: colors.brandDark,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 45,
  },
  flex: {
    flex: 1,
  },
  footer: {
    color: `${colors.brandDark}8C`,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  fullWidth: {
    marginTop: 8,
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 32,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  subtitle: {
    color: `${colors.brandDark}B3`,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  tag: {
    color: `${colors.brandDark}8C`,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 3.5,
    marginBottom: 8,
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    color: colors.brandDark,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
});
