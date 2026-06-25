import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import type { PlaceReference } from "@/lib/places";
import { colors } from "@/theme/colors";

import { RouteDayCarousel } from "./RouteDayCarousel";
import type { RouteDraftDay } from "../types/route-create.types";

type RouteCreateStep1Props = {
  activeDayId: string;
  days: RouteDraftDay[];
  onAddDay: () => void;
  onAddStop: (dayId: string) => void;
  onChangeDayDestination: (dayId: string, place: PlaceReference | null) => void;
  onChangeDayOrigin: (dayId: string, place: PlaceReference | null) => void;
  onChangeStop: (dayId: string, stopId: string, place: PlaceReference | null) => void;
  onRemoveDay: (dayId: string) => void;
  onRemoveStop: (dayId: string, stopId: string) => void;
  onSelectDay: (dayId: string) => void;
};

export function RouteCreateStep1({
  activeDayId,
  days,
  onAddDay,
  onAddStop,
  onChangeDayDestination,
  onChangeDayOrigin,
  onChangeStop,
  onRemoveDay,
  onRemoveStop,
  onSelectDay,
}: RouteCreateStep1Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <Text style={styles.title}>Para onde vamos?</Text>

      <RouteDayCarousel
        activeDayId={activeDayId}
        days={days}
        onAddStop={onAddStop}
        onChangeDayDestination={onChangeDayDestination}
        onChangeDayOrigin={onChangeDayOrigin}
        onChangeStop={onChangeStop}
        onRemoveDay={onRemoveDay}
        onRemoveStop={onRemoveStop}
        onSelectDay={onSelectDay}
      />

      <Pressable accessibilityRole="button" style={styles.addDayButton} onPress={onAddDay}>
        <Ionicons color={colors.brandDark} name="add" size={18} />
        <Text style={styles.addDayText}>Adicionar novo dia ao roteiro</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addDayButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addDayText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 20,
  },
  title: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
    paddingHorizontal: 24,
  },
});
