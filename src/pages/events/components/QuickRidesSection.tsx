import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import type { QuickRide } from "@/pages/quick-rides/types/quick-ride.types";
import { colors } from "@/theme/colors";

import { QuickRideCard } from "./QuickRideCard";

const RIDES_PER_PAGE = 3;
const HORIZONTAL_PADDING = 16;
const PAGE_PEEK = 32;
const PAGE_GAP = 12;

type QuickRidesSectionProps = {
  onRidePress: (ride: QuickRide) => void;
  rides: QuickRide[];
};

type QuickRidePage = {
  id: string;
  rides: QuickRide[];
};

function chunkRides(rides: QuickRide[], pageSize: number): QuickRidePage[] {
  const pages: QuickRidePage[] = [];

  for (let index = 0; index < rides.length; index += pageSize) {
    const slice = rides.slice(index, index + pageSize);
    pages.push({
      id: slice.map((ride) => ride.id).join("-"),
      rides: slice,
    });
  }

  return pages;
}

export function QuickRidesSection({ onRidePress, rides }: QuickRidesSectionProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);
  const pages = useMemo(() => chunkRides(rides, RIDES_PER_PAGE), [rides]);

  const hasMultiplePages = pages.length > 1;
  const pageWidth = hasMultiplePages
    ? screenWidth - HORIZONTAL_PADDING - PAGE_PEEK
    : screenWidth - HORIZONTAL_PADDING * 2;
  const snapInterval = pageWidth + PAGE_GAP;

  if (pages.length === 0) {
    return null;
  }

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    setActivePage(Math.max(0, Math.min(nextPage, pages.length - 1)));
  };

  const renderPage: ListRenderItem<QuickRidePage> = ({ item, index }) => (
    <View
      style={[
        styles.page,
        {
          marginRight: index < pages.length - 1 ? PAGE_GAP : 0,
          width: pageWidth,
        },
      ]}
    >
      {item.rides.map((ride, rideIndex) => (
        <View key={ride.id}>
          <QuickRideCard ride={ride} onPress={onRidePress} />
          {rideIndex < item.rides.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Rolês rápidos pra você</Text>
        <Text style={styles.subtitle}>A galera chamando pra sair agora</Text>
      </View>

      <FlatList
        horizontal
        nestedScrollEnabled
        bounces={false}
        data={pages}
        decelerationRate="fast"
        getItemLayout={
          hasMultiplePages
            ? (_, index) => ({
                index,
                length: snapInterval,
                offset: snapInterval * index,
              })
            : undefined
        }
        keyExtractor={(item) => item.id}
        renderItem={renderPage}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={hasMultiplePages ? snapInterval : undefined}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        onMomentumScrollEnd={hasMultiplePages ? handleMomentumScrollEnd : undefined}
      />

      {hasMultiplePages ? (
        <View style={styles.dots}>
          {pages.map((page, index) => (
            <View
              key={page.id}
              style={[styles.dot, index === activePage && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: "rgba(28, 33, 38, 0.08)",
    height: 1,
    marginLeft: 16,
  },
  dot: {
    backgroundColor: "#D1D5DB",
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.brandPrimary,
    width: 16,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 8,
    paddingBottom: 4,
  },
  header: {
    marginBottom: 4,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  page: {
    paddingBottom: 4,
  },
  section: {
    marginTop: 8,
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
