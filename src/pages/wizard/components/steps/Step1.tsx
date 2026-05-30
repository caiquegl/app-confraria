import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { InputField } from "@/components/InputField";

import { WizardLayout } from "../WizardLayout";
import { checkEmailExists } from "../../services/wizard.service";
import { step1Schema, type Step1Data, type StepProps } from "../../types/wizard.types";

export function Step1({ defaultValues, onBack, onNext }: StepProps) {
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step1Data>({
    defaultValues: {
      email: defaultValues.email ?? "",
      firstName: defaultValues.firstName ?? "",
    },
    resolver: zodResolver(step1Schema),
  });

  const handleNext = async (data: Step1Data) => {
    setIsCheckingEmail(true);
    try {
      const emailInUse = await checkEmailExists(data.email);
      if (emailInUse) {
        setError("email", { message: "Este e-mail já está em uso" });
        return;
      }
      onNext(data);
    } catch {
      setError("email", { message: "Não foi possível verificar o e-mail. Tente novamente." });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  return (
    <WizardLayout step={1} title="Como podemos te chamar?">
      <View style={styles.fields}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label="Seu primeiro nome"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              onClear={() => onChange("")}
              error={errors.firstName?.message}
              autoComplete="given-name"
              returnKeyType="next"
            />
          )}
        />

        <View>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Seu e-mail principal"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onClear={() => onChange("")}
                error={errors.email?.message}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
              />
            )}
          />
          <Text style={styles.hint}>Esse e-mail será para cadastro</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          size="lg"
          style={styles.fullWidth}
          disabled={isCheckingEmail}
          onPress={handleSubmit(handleNext)}
        >
          {isCheckingEmail ? "Verificando..." : "Avançar"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          style={styles.fullWidth}
          disabled={isCheckingEmail}
          onPress={onBack}
        >
          Voltar
        </Button>
      </View>
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 32,
  },
  fields: {
    gap: 16,
  },
  fullWidth: {
    width: "100%",
  },
  hint: {
    color: "#6B7280",
    fontSize: 12,
    marginLeft: 4,
    marginTop: 6,
  },
});
