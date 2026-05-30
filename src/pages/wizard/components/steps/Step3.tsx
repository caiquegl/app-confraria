import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { OptionSelect } from "@/components/OptionSelect";

import { WizardLayout } from "../WizardLayout";
import type { Step3Data, StepProps } from "../../types/wizard.types";

export function Step3({ defaultValues, onBack, onNext }: StepProps) {
  const [isAdult, setIsAdult] = useState<boolean | undefined>(defaultValues.isAdult);
  const [hasLicense, setHasLicense] = useState<boolean | undefined>(defaultValues.hasLicense);

  const isComplete = isAdult !== undefined && hasLicense !== undefined;

  const handleNext = () => {
    if (!isComplete) return;
    const data: Step3Data = { hasLicense: hasLicense!, isAdult: isAdult! };
    onNext(data);
  };

  return (
    <WizardLayout step={3} title="Verificação de idade e habilitação">
      <View style={styles.fields}>
        <View style={styles.row}>
          <OptionSelect
            label="+18 Anos"
            selected={isAdult === true}
            onPress={() => setIsAdult(true)}
            flex={1}
          />
          <OptionSelect
            label="Menor de idade"
            selected={isAdult === false}
            onPress={() => setIsAdult(false)}
            flex={1}
          />
        </View>

        <View style={styles.column}>
          <OptionSelect
            label="Tenho habilitação"
            selected={hasLicense === true}
            onPress={() => setHasLicense(true)}
          />
          <OptionSelect
            label="Não tenho habilitação"
            selected={hasLicense === false}
            onPress={() => setHasLicense(false)}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          size="lg"
          style={styles.fullWidth}
          disabled={!isComplete}
          onPress={handleNext}
        >
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
  column: {
    gap: 12,
  },
  fields: {
    gap: 24,
  },
  fullWidth: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
});
