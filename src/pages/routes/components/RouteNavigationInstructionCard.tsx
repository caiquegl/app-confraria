import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { colors } from "@/theme/colors";

import type { NavigationManeuverPreview } from "../utils/navigation-steps.utils";

type RouteNavigationInstructionCardProps = {
  activeStepIndex: number;
  items: NavigationManeuverPreview[];
};

export function RouteNavigationInstructionCard({
  activeStepIndex,
  items,
}: RouteNavigationInstructionCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32;
  const listRef = useRef<FlatList<NavigationManeuverPreview>>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const previousStepIndexRef = useRef(activeStepIndex);

  useEffect(() => {
    if (previousStepIndexRef.current === activeStepIndex) {
      return;
    }

    previousStepIndexRef.current = activeStepIndex;
    setVisibleIndex(0);
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, [activeStepIndex]);

  useEffect(() => {
    if (visibleIndex >= items.length) {
      setVisibleIndex(0);
    }
  }, [items.length, visibleIndex]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setVisibleIndex(Math.max(0, Math.min(nextIndex, items.length - 1)));
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={items}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: cardWidth,
          offset: cardWidth * index,
        })}
        keyExtractor={(item, index) => `${item.stepIndex}-${item.kind}-${index}`}
        pagingEnabled
        renderItem={({ item }) => (
          <View style={[styles.card, { width: cardWidth }]}>
            <View
              style={[
                styles.iconWrap,
                item.kind === "off_route" && styles.iconWrapOffRoute,
                item.kind === "upcoming" && styles.iconWrapUpcoming,
              ]}
            >
              <Ionicons color={colors.brandDark} name={item.icon} size={22} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.distance}>{item.distanceLabel}</Text>
              <Text numberOfLines={2} style={styles.instruction}>
                {item.instruction}
              </Text>
              {item.kind === "upcoming" ? (
                <Text style={styles.upcomingLabel}>Próxima manobra</Text>
              ) : null}
            </View>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={cardWidth}
        horizontal
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {items.length > 1 ? (
        <View style={styles.dotsRow}>
          {items.map((item, index) => (
            <View
              key={`${item.stepIndex}-${item.kind}-${index}`}
              style={[styles.dot, index === visibleIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.brandDark,
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  distance: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },
  dot: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  dotActive: {
    backgroundColor: colors.brandGreen,
    width: 14,
  },
  dotsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 6,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  iconWrapOffRoute: {
    backgroundColor: "#93C5FD",
  },
  iconWrapUpcoming: {
    backgroundColor: "#D9F99D",
  },
  instruction: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  upcomingLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginTop: 4,
    textTransform: "uppercase",
  },
  wrap: {
    width: "100%",
  },
});
