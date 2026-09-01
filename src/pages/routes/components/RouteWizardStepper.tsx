import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { WizardStep } from "../types/route-create.types";

const STEPS: { label: string; step: WizardStep }[] = [
  { label: "Rota", step: 1 },
  { label: "Bike", step: 2 },
  { label: "Config", step: 3 },
  { label: "Resumo", step: 4 },
];

type RouteWizardStepperProps = {
  currentStep: WizardStep;
  maxReachableStep?: WizardStep;
  onStepPress?: (step: WizardStep) => void;
};

export function RouteWizardStepper({
  currentStep,
  maxReachableStep = currentStep,
  onStepPress,
}: RouteWizardStepperProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      {STEPS.map((item, index) => {
        const isActive = item.step === currentStep;
        const isCompleted = item.step < currentStep;
        const isUnlocked = item.step <= maxReachableStep;
        const isNavigable =
          !isActive && isUnlocked && onStepPress != null;

        const stepContent = (
          <>
            <View
              style={[
                styles.bubble,
                isActive && styles.bubbleActive,
                isCompleted && styles.bubbleCompleted,
                isUnlocked && !isActive && !isCompleted && styles.bubbleUnlocked,
                isNavigable && styles.bubbleNavigable,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  isActive && styles.bubbleTextActive,
                  isCompleted && styles.bubbleTextCompleted,
                  isUnlocked && !isActive && !isCompleted && styles.bubbleTextUnlocked,
                ]}
              >
                {item.step}
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                isCompleted && styles.labelCompleted,
                isUnlocked && !isActive && !isCompleted && styles.labelUnlocked,
              ]}
            >
              {item.label}
            </Text>
          </>
        );

        return (
          <View key={item.step} style={styles.itemWrap}>
            {index > 0 ? (
              <View
                style={[
                  styles.connector,
                  item.step <= maxReachableStep && styles.connectorActive,
                ]}
              />
            ) : null}
            {isNavigable ? (
              <Pressable
                accessibilityLabel={
                  item.step < currentStep
                    ? `Voltar para ${item.label}`
                    : `Ir para ${item.label}`
                }
                accessibilityRole="button"
                hitSlop={8}
                style={({ pressed }) => [styles.stepBlock, pressed && styles.stepBlockPressed]}
                onPress={() => onStepPress(item.step)}
              >
                {stepContent}
              </Pressable>
            ) : (
              <View style={styles.stepBlock}>{stepContent}</View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  bubble: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  bubbleActive: {
    backgroundColor: colors.brandGreen,
  },
  bubbleCompleted: {
    backgroundColor: "rgba(200, 247, 99, 0.2)",
  },
  bubbleNavigable: {
    borderColor: "rgba(114, 143, 33, 0.25)",
    borderWidth: 1,
  },
  bubbleText: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  bubbleTextActive: {
    color: colors.brandDark,
  },
  bubbleTextCompleted: {
    color: colors.brandActive,
  },
  bubbleTextUnlocked: {
    color: colors.brandActive,
  },
  bubbleUnlocked: {
    backgroundColor: "rgba(200, 247, 99, 0.12)",
  },
  connector: {
    backgroundColor: colors.border.subtle,
    height: 1,
    marginHorizontal: 4,
    marginTop: 14,
    width: 20,
  },
  connectorActive: {
    backgroundColor: colors.brandGreen,
  },
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "center",
  },
  itemWrap: {
    alignItems: "center",
    flexDirection: "row",
  },
  label: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },
  labelActive: {
    color: colors.brandDark,
  },
  labelCompleted: {
    color: colors.brandActive,
  },
  labelUnlocked: {
    color: colors.brandActive,
  },
  stepBlock: {
    alignItems: "center",
  },
  stepBlockPressed: {
    opacity: 0.7,
  },
});
