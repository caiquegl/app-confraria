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
              <Ionicons color={colors.brandDark} name={item.icon} size={28} />
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
    borderRadius: 20,
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  distance: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32,
  },
  dot: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.brandGreen,
    width: 18,
  },
  dotsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 10,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconWrapOffRoute: {
    backgroundColor: "#93C5FD",
  },
  iconWrapUpcoming: {
    backgroundColor: "#D9F99D",
  },
  instruction: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  upcomingLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginTop: 6,
    textTransform: "uppercase",
  },
  wrap: {
    width: "100%",
  },
});
