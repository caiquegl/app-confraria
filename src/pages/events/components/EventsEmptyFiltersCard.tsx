import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { colors } from "@/theme/colors";

type EventsEmptyFiltersCardProps = {
  isLoading?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
  variant?: "error";
};

export function EventsEmptyFiltersCard({
  isLoading = false,
  onRetry,
  retrying = false,
}: EventsEmptyFiltersCardProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  return (
    <ErrorState
      description="Verifique a conexão e tente novamente. Isso não significa que não há eventos."
      layout="card"
      retrying={retrying}
      style={styles.errorCard}
      title="Não foi possível carregar os eventos"
      onRetry={() => onRetry?.()}
    />
  );
}

const styles = StyleSheet.create({
  errorCard: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    paddingVertical: 24,
  },
});
