import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { Service } from "../types/services.types";
import { SERVICES_CARD_WIDTH, ServicesCard } from "./ServicesCard";

const H_PADDING = 16;
const CARD_GAP = 12;

type ServicesSectionProps = {
  title: string;
  services: Service[];
  onServicePress: (service: Service) => void;
  onToggleFavorite?: (service: Service) => void;
  onSeeMore?: () => void;
};

export function ServicesSection({
  title,
  services,
  onServicePress,
  onToggleFavorite,
  onSeeMore,
}: ServicesSectionProps) {
  if (services.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeMore && (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onSeeMore}>
            <Text style={styles.seeMore}>Veja mais</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        nestedScrollEnabled
        data={services}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: SERVICES_CARD_WIDTH + CARD_GAP,
          offset: (SERVICES_CARD_WIDTH + CARD_GAP) * index,
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <ServicesCard
              service={item}
              onPress={onServicePress}
              onToggleFavorite={onToggleFavorite}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={SERVICES_CARD_WIDTH + CARD_GAP}
        contentContainerStyle={{ paddingHorizontal: H_PADDING }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardItem: {
    marginRight: CARD_GAP,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: H_PADDING,
  },
  section: {
    marginTop: 24,
  },
  seeMore: {
    color: colors.brandPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
  },
});
