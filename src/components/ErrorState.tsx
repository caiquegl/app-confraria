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
import { colors } from "@/theme/colors";

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
          <Ionicons color="#9CA3AF" name={icon} size={isCard || layout === "inline" ? 28 : 48} />
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
            <ActivityIndicator color={colors.brandDark} size="small" />
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

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  cardAction: {
    marginTop: 16,
  },
  cardDescription: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    textAlign: "center",
  },
  cardTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  compactIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  inline: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  page: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  pageAction: {
    marginTop: 24,
    minWidth: 220,
  },
  pageDescription: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
    textAlign: "center",
  },
  pageIcon: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    height: 96,
    justifyContent: "center",
    marginBottom: 24,
    width: 96,
  },
  pageTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
});
