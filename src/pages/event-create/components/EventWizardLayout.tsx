import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressBar } from "@/components/ProgressBar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventWizardLayoutProps = {
  children: React.ReactNode;
  onClose: () => void;
  step: number;
  subtitle?: string;
  title: string;
  totalSteps: number;
};

export function EventWizardLayout({
  children,
  onClose,
  step,
  subtitle,
  title,
  totalSteps,
}: EventWizardLayoutProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 20) + 18, paddingTop: 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable accessibilityRole="button" style={styles.closeButton} onPress={onClose}>
              <Ionicons color={colors.brandDark} name="close" size={20} />
            </Pressable>
            <Text style={styles.stepLabel}>
              Etapa {step} de {totalSteps}
            </Text>
          </View>

          <ProgressBar currentStep={step} totalSteps={totalSteps} />

          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 8,
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
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  titleBlock: {
    marginBottom: 24,
  },
});
