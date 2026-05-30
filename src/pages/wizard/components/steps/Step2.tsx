import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { InputField } from "@/components/InputField";

import { WizardLayout } from "../WizardLayout";
import { step2Schema, type Step2Data, type StepProps } from "../../types/wizard.types";

export function Step2({ defaultValues, onBack, onNext }: StepProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Data>({
    defaultValues: {
      password: defaultValues.password ?? "",
      passwordConfirm: defaultValues.passwordConfirm ?? "",
    },
    resolver: zodResolver(step2Schema),
  });

  return (
    <WizardLayout step={2} title="Agora, crie uma senha segura...">
      <View style={styles.fields}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label="Senha"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.password?.message}
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="passwordConfirm"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label="Repita sua senha"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.passwordConfirm?.message}
              returnKeyType="done"
            />
          )}
        />
      </View>

      <View style={styles.actions}>
        <Button size="lg" style={styles.fullWidth} onPress={handleSubmit(onNext)}>
          Avançar
        </Button>
        <Button variant="secondary" size="lg" style={styles.fullWidth} onPress={onBack}>
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
});
