import { FlatList, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { Service } from "../types/services.types";
import {
    SERVICES_QUICK_CARD_WIDTH,
    ServicesQuickCard,
} from "./ServicesQuickCard";

const H_PADDING = 16;
const CARD_GAP = 12;

type ServicesQuickSectionProps = {
  services: Service[];
  onServicePress: (service: Service) => void;
};

export function ServicesQuickSection({
  services,
  onServicePress,
}: ServicesQuickSectionProps) {
  if (services.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Soluções rápidas</Text>

      <FlatList
        horizontal
        nestedScrollEnabled
        data={services}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: SERVICES_QUICK_CARD_WIDTH + CARD_GAP,
          offset: (SERVICES_QUICK_CARD_WIDTH + CARD_GAP) * index,
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <ServicesQuickCard service={item} onPress={onServicePress} />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={SERVICES_QUICK_CARD_WIDTH + CARD_GAP}
        contentContainerStyle={{ paddingHorizontal: H_PADDING }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardItem: {
    marginRight: CARD_GAP,
  },
  section: {
    marginTop: 20,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: H_PADDING,
  },
});
