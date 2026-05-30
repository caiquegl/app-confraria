import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { OptionSelect } from "@/components/OptionSelect";
import { SelectField } from "@/components/SelectField";
import { colors } from "@/theme/colors";

import { WizardLayout } from "../WizardLayout";
import { fetchBikeCategories, fetchTripStyles } from "../../services/wizard.service";
import type { BikeCategory, Step4Data, StepProps, TripStyle } from "../../types/wizard.types";

export function Step4({ defaultValues, onBack, onNext }: StepProps) {
  const [bikeCategories, setBikeCategories] = useState<BikeCategory[]>([]);
  const [tripStyles, setTripStyles] = useState<TripStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [bikeCategoryIds, setBikeCategoryIds] = useState<string[]>(
    defaultValues.bikeCategoryIds ?? [],
  );
  const [tripStyleId, setTripStyleId] = useState<string>(defaultValues.tripStyleId ?? "");

  useEffect(() => {
    Promise.all([fetchBikeCategories(), fetchTripStyles()])
      .then(([categories, styles]) => {
        setBikeCategories(categories);
        setTripStyles(styles);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const toggleCategory = (id: string) => {
    setBikeCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const isComplete = bikeCategoryIds.length > 0 && tripStyleId.length > 0;

  const handleNext = () => {
    if (!isComplete) return;
    const data: Step4Data = { bikeCategoryIds, tripStyleId };
    onNext(data);
  };

  const tripStyleOptions = tripStyles.map((s) => ({ label: s.name, value: s.id }));

  return (
    <WizardLayout
      step={4}
      title="Queremos conhecer seu estilo na estrada."
      subtitle="Isso ajuda a sugerir eventos do seu perfil."
    >
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.brandGreen} />
        </View>
      ) : (
        <View style={styles.fields}>
          <Text style={styles.sectionLabel}>Qual a categoria da sua moto?</Text>

          <View style={styles.grid}>
            {bikeCategories.map((cat) => (
              <View key={cat.id} style={styles.gridItem}>
                <OptionSelect
                  label={cat.name}
                  selected={bikeCategoryIds.includes(cat.id)}
                  onPress={() => toggleCategory(cat.id)}
                />
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabelSecondary}>Seu tipo de rota</Text>

          <SelectField
            label="Selecione o tipo de rota"
            options={tripStyleOptions}
            value={tripStyleId}
            onChange={setTripStyleId}
          />
        </View>
      )}

      <View style={styles.actions}>
        <Button
          size="lg"
          style={styles.fullWidth}
          disabled={!isComplete || isLoading}
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
  divider: {
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    marginVertical: 8,
  },
  fields: {
    gap: 12,
  },
  fullWidth: {
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "47%",
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  sectionLabel: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionLabelSecondary: {
    color: "#6B7280",
    fontSize: 14,
  },
});
