import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Button } from "@/components/Button";
import { type AppColors, radii, spacing, typography, useTheme, useThemedStyles } from "@/theme";

export type ErrorStateAction = {
  accessibilityLabel?: string;
  label: string;
  onPress: () => void;
  variant?: "default" | "outline" | "secondary";
};

export type ErrorStateProps = {
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  layout?: "page" | "card" | "inline";
  onRetry: () => void;
  retryLabel?: string;
  retrying?: boolean;
  secondaryAction?: ErrorStateAction;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function isTechnicalErrorMessage(message: string) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return /axios|ECONN|ETIMEDOUT|HTTP\/\d|Network Error|stack|status\s*\d{3}|Request failed/i.test(
    message,
  );
}

export function ErrorState({
  description = "Verifique a conexão e tente novamente.",
  icon = "cloud-offline-outline",
  layout = "page",
  onRetry,
  retryLabel = "Tentar novamente",
  retrying = false,
  secondaryAction,
  style,
  title,
}: ErrorStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isCard = layout === "card";
  const retryAccessibilityLabel = retrying ? "Tentando novamente" : retryLabel;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[layout === "card" ? styles.card : layout === "inline" ? styles.inline : styles.page, style]}
    >
      {icon ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={isCard || layout === "inline" ? styles.compactIcon : styles.pageIcon}
        >
          <Ionicons color={colors.text.muted} name={icon} size={isCard || layout === "inline" ? 28 : 48} />
        </View>
      ) : null}

      <Text accessibilityRole="header" style={isCard ? styles.cardTitle : styles.pageTitle}>
        {title}
      </Text>

      {description ? (
        <Text style={isCard ? styles.cardDescription : styles.pageDescription}>{description}</Text>
      ) : null}

      <Button
        accessibilityLabel={retryAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ busy: retrying, disabled: retrying }}
        disabled={retrying}
        size={isCard || layout === "inline" ? "sm" : "lg"}
        style={isCard || layout === "inline" ? styles.cardAction : styles.pageAction}
        variant={isCard || layout === "inline" ? "outline" : "default"}
        onPress={() => {
          if (retrying) return;
          onRetry();
        }}
      >
        {retrying ? (
          <>
            <ActivityIndicator color={colors.text.primary} size="small" />
            Tentando...
          </>
        ) : (
          retryLabel
        )}
      </Button>

      {secondaryAction ? (
        <Button
          accessibilityLabel={secondaryAction.accessibilityLabel ?? secondaryAction.label}
          accessibilityRole="button"
          disabled={retrying}
          size={isCard || layout === "inline" ? "sm" : "lg"}
          style={isCard || layout === "inline" ? styles.cardAction : styles.pageAction}
          variant={secondaryAction.variant ?? "outline"}
          onPress={secondaryAction.onPress}
        >
          {secondaryAction.label}
        </Button>
      ) : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing["4xl"],
    paddingVertical: spacing["4xl"],
  },
  cardAction: {
    marginTop: spacing["2xl"],
  },
  cardDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.text.primary,
    textAlign: "center",
  },
  compactIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  inline: {
    alignItems: "center",
    paddingHorizontal: spacing["4xl"],
  },
  page: {
    alignItems: "center",
    paddingHorizontal: spacing["4xl"],
    paddingTop: spacing["5xl"],
  },
  pageAction: {
    marginTop: spacing["4xl"],
    minWidth: 220,
  },
  pageDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    maxWidth: 280,
    textAlign: "center",
  },
  pageIcon: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.pill,
    height: 96,
    justifyContent: "center",
    marginBottom: spacing["4xl"],
    width: 96,
  },
  pageTitle: {
    ...typography.titleSection,
    color: colors.text.primary,
    textAlign: "center",
  },
});
