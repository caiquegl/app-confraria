import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [hasError, setHasError] = useState(false);

  const loadRides = useCallback(async () => {
    setHasError(false);
    setIsLoading(true);

    try {
      const response = await fetchMyQuickRides();
      setRides(response);
    } catch {
      setRides([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
        <View style={styles.centered}>
          <Text style={styles.errorText}>Não foi possível carregar seus rolês.</Text>
        </View>
      ) : null}

      {!isLoading && !hasError && rides.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nenhum rolê ainda</Text>
          <Text style={styles.emptyText}>
            Crie um rolê rápido ou tope em um da aba Eventos para vê-lo aqui.
          </Text>
        </View>
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
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
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
