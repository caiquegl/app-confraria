import { Controller } from "react-hook-form";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { InputField } from "@/components/InputField";
import { Logo } from "@/components/Logo";
import { SocialButtons } from "@/pages/landing/components/SocialButtons";
import { colors } from "@/theme/colors";

import { useLogin } from "../business/useLogin";
import type { LoginViewProps } from "../types/login.types";

export function LoginView({ onBack }: LoginViewProps) {
  const { control, errors, handleSubmit, isSubmitting, onSubmit } = useLogin();

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
            <Text style={styles.tag}>Acesse sua conta</Text>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>
              Entre para continuar no fluxo principal do Confraria.
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
                  returnKeyType="next"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onClear={() => onChange("")}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <InputField
                  autoComplete="password"
                  error={errors.password?.message}
                  label="Senha"
                  returnKeyType="done"
                  secureTextEntry
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <TouchableOpacity
              activeOpacity={0.65}
              style={styles.forgotButton}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <Button
              disabled={isSubmitting}
              size="lg"
              style={styles.fullWidth}
              onPress={handleSubmit(onSubmit)}
            >
              Entrar
            </Button>

            <View style={styles.socialSection}>
              <Text style={styles.socialLabel}>ou continue com</Text>
              <SocialButtons />
            </View>

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
  forgotButton: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: `${colors.brandDark}99`,
    fontSize: 14,
    fontWeight: "500",
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
  socialLabel: {
    color: `${colors.brandDark}73`,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 2.8,
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
  },
  socialSection: {
    marginTop: 12,
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
