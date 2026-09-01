import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Button } from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme";

export type EmptyStateAction = {
  accessibilityLabel?: string;
  label: string;
  onPress: () => void;
  variant?: "default" | "outline";
};

export type EmptyStateProps = {
  action?: EmptyStateAction;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  layout?: "page" | "card";
  secondaryAction?: EmptyStateAction;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon,
  layout = "page",
  secondaryAction,
  style,
  title,
}: EmptyStateProps) {
  const isCard = layout === "card";
  const actionVariant = action?.variant ?? (isCard ? "outline" : "default");
  const secondaryVariant = secondaryAction?.variant ?? "outline";

  return (
    <View style={[isCard ? styles.card : styles.page, style]}>
      {icon ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={isCard ? styles.cardIcon : styles.pageIcon}
        >
          <Ionicons color={colors.border.default} name={icon} size={isCard ? 28 : 48} />
        </View>
      ) : null}

      <Text accessibilityRole="header" style={isCard ? styles.cardTitle : styles.pageTitle}>
        {title}
      </Text>

      {description ? (
        <Text style={isCard ? styles.cardDescription : styles.pageDescription}>{description}</Text>
      ) : null}

      {action ? (
        <Button
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          accessibilityRole="button"
          size={isCard ? "sm" : "lg"}
          style={isCard ? styles.cardAction : styles.pageAction}
          variant={actionVariant}
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      ) : null}

      {secondaryAction ? (
        <Button
          accessibilityLabel={secondaryAction.accessibilityLabel ?? secondaryAction.label}
          accessibilityRole="button"
          size={isCard ? "sm" : "lg"}
          style={isCard ? styles.cardAction : styles.pageAction}
          variant={secondaryVariant}
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
  cardIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.text.primary,
    textAlign: "center",
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
