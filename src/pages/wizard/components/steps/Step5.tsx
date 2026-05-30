import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { OptionSelect } from "@/components/OptionSelect";
import { colors } from "@/theme/colors";

import { WizardLayout } from "../WizardLayout";
import { fetchRidingCompanions } from "../../services/wizard.service";
import type { RidingCompanion, Step5Data, StepProps } from "../../types/wizard.types";

export function Step5({ defaultValues, isPreparingProfile, onBack, onNext }: StepProps) {
  const [companions, setCompanions] = useState<RidingCompanion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ridingCompanionIds, setRidingCompanionIds] = useState<string[]>(
    defaultValues.ridingCompanionIds ?? [],
  );

  useEffect(() => {
    fetchRidingCompanions()
      .then(setCompanions)
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (id: string) => {
    setRidingCompanionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const isComplete = ridingCompanionIds.length > 0;

  const handleSubmit = () => {
    if (!isComplete) return;
    const data: Step5Data = { ridingCompanionIds };
    onNext(data);
  };

  return (
    <WizardLayout step={5} title={"Quase lá! Que bom que você ficou até aqui \uD83E\uDD79"}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.brandGreen} />
        </View>
      ) : (
        <View style={styles.fields}>
          <Text style={styles.description}>
            Você vai ganhar um{" "}
            <Text style={styles.bold}>aplicativo totalmente personalizado</Text> pra você.
          </Text>

          <Text style={styles.sectionLabel}>Costuma rodar com quem?</Text>

          <View style={styles.row}>
            {companions.slice(0, 2).map((c) => (
              <View key={c.id} style={styles.rowItem}>
                <OptionSelect
                  label={c.name}
                  selected={ridingCompanionIds.includes(c.id)}
                  onPress={() => toggle(c.id)}
                />
              </View>
            ))}
          </View>

          <View style={styles.column}>
            {companions.slice(2).map((c) => (
              <OptionSelect
                key={c.id}
                label={c.name}
                selected={ridingCompanionIds.includes(c.id)}
                onPress={() => toggle(c.id)}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          size="lg"
          style={styles.fullWidth}
          disabled={!isComplete || isPreparingProfile || isLoading}
          onPress={handleSubmit}
        >
          Partiu estrada!
        </Button>
        <Button
          variant="secondary"
          size="lg"
          style={styles.fullWidth}
          disabled={isPreparingProfile}
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
  bold: {
    color: colors.brandDark,
    fontWeight: "700",
  },
  column: {
    gap: 12,
  },
  description: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
  },
  fields: {
    gap: 16,
  },
  fullWidth: {
    width: "100%",
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  sectionLabel: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
