import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

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
          <Ionicons color="#D1D5DB" name={icon} size={isCard ? 28 : 48} />
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
  cardIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
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
