import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
};

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${percentage}%` }]}>
        <View style={styles.iconWrapper}>
          <Ionicons name="bicycle" size={14} color={colors.brandDark} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  fill: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: "100%",
    position: "relative",
  },
  iconWrapper: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    bottom: -4,
    elevation: 2,
    justifyContent: "center",
    padding: 2,
    position: "absolute",
    right: -10,
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  track: {
    backgroundColor: colors.border.subtle,
    borderRadius: 999,
    height: 8,
    marginBottom: 32,
    marginTop: 8,
    overflow: "visible",
    width: "100%",
  },
});
