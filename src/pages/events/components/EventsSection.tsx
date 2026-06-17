import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";
import { colors } from "@/theme/colors";

import { EVENTS_DISCOVER_CARD_WIDTH, EventsDiscoverCard } from "./EventsDiscoverCard";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

type EventsSectionProps = {
  events: PublicProfileEvent[];
  onEventPress: (event: PublicProfileEvent) => void;
  onSeeMore?: () => void;
  onToggleFavorite?: (event: PublicProfileEvent) => void;
  subtitle?: string;
  title: string;
};

export function EventsSection({
  events,
  onEventPress,
  onSeeMore,
  onToggleFavorite,
  subtitle,
  title,
}: EventsSectionProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onSeeMore ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onSeeMore}>
            <Text style={styles.seeMore}>Veja mais</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        nestedScrollEnabled
        data={events}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: EVENTS_DISCOVER_CARD_WIDTH + CARD_GAP,
          offset: (EVENTS_DISCOVER_CARD_WIDTH + CARD_GAP) * index,
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <EventsDiscoverCard
              event={item}
              onPress={onEventPress}
              onToggleFavorite={onToggleFavorite}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={EVENTS_DISCOVER_CARD_WIDTH + CARD_GAP}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardItem: {
    marginRight: CARD_GAP,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  headerCopy: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  seeMore: {
    color: colors.brandPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
  },
});
