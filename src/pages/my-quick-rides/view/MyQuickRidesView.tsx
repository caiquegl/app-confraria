import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { QuickRideCard } from "@/pages/events/components/QuickRideCard";
import { fetchMyQuickRides } from "@/pages/quick-rides/services/quick-rides.service";
import type { QuickRide, QuickRideListItem } from "@/pages/quick-rides/types/quick-ride.types";
import { isQuickRideListItemEnded } from "@/pages/quick-rides/types/quick-ride.types";
import { colors } from "@/theme/colors";

type MyQuickRidesViewProps = {
  onBack: () => void;
};

type QuickRideSection = {
  data: QuickRideListItem[];
  key: string;
  title: string;
};

function getRoleBadge(ride: QuickRideListItem): string {
  if (ride.isHost) return "Organizador";
  if (ride.isActive) return "Participando";
  return "Participou";
}

export function MyQuickRidesView({ onBack }: MyQuickRidesViewProps) {
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState<QuickRideListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inFlightRef = useRef(false);
  const hasAttemptedRef = useRef(false);
  const hasDataRef = useRef(false);

  const loadRides = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const hasData = hasDataRef.current;
    if (hasAttemptedRef.current && !hasData) {
      setIsRetrying(true);
    } else if (!hasData) {
      setIsLoading(true);
    }

    try {
      const response = await fetchMyQuickRides();
      setRides(response);
      setHasError(false);
      hasDataRef.current = true;
    } catch {
      if (hasData) {
        Toast.show({
          type: "error",
          text1: "Não foi possível atualizar seus rolês",
          text2: "Mantivemos a lista anterior.",
        });
      } else {
        setHasError(true);
      }
    } finally {
      hasAttemptedRef.current = true;
      inFlightRef.current = false;
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRides();
    }, [loadRides]),
  );

  const sections = useMemo<QuickRideSection[]>(() => {
    const active = rides.filter((ride) => !isQuickRideListItemEnded(ride));
    const ended = rides.filter((ride) => isQuickRideListItemEnded(ride));

    const result: QuickRideSection[] = [];
    if (active.length > 0) {
      result.push({ key: "active", title: "Ativos", data: active });
    }
    if (ended.length > 0) {
      result.push({ key: "ended", title: "Encerrados", data: ended });
    }
    return result;
  }, [rides]);

  const handleRidePress = useCallback((ride: QuickRide) => {
    router.push({
      pathname: "/quick-rides/[quickRideId]",
      params: { quickRideId: ride.id },
    });
  }, []);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Meus rolês rápidos</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : null}

      {!isLoading && hasError ? (
        <ErrorState
          description="Verifique a conexão e tente novamente. Isso não significa que você não tem rolês."
          retrying={isRetrying}
          style={styles.emptyState}
          title="Não foi possível carregar seus rolês"
          onRetry={() => void loadRides()}
        />
      ) : null}

      {!isLoading && !hasError && rides.length === 0 ? (
        <EmptyState
          description="Crie um rolê rápido ou tope em um da aba Eventos para vê-lo aqui."
          icon="bicycle-outline"
          style={styles.emptyState}
          title="Nenhum rolê ainda"
          action={{
            accessibilityLabel: "Criar rolê rápido",
            label: "Criar rolê rápido",
            onPress: () => router.push("/quick-rides/create" as Href),
          }}
        />
      ) : null}

      {!isLoading && !hasError && rides.length > 0 ? (
        <SectionList
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => (
            <QuickRideCard
              ended={section.key === "ended"}
              ride={item}
              roleBadge={getRoleBadge(item)}
              onPress={handleRidePress}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          sections={sections}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 0,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: colors.brandGray,
    paddingBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
