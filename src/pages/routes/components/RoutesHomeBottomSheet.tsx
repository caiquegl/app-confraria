import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { type AppColors, useThemedStyles } from "@/theme";

export type RoutesSheetDetent = "collapsed" | "mid" | "expanded";

/** Frações da área do mapa (já descontando header e BottomNav no layout). */
export const ROUTES_SHEET_RATIO: Record<RoutesSheetDetent, number> = {
  collapsed: 0.28,
  mid: 0.52,
  expanded: 0.88,
};

/** Espaço mínimo entre o topo do mapa e o sheet expandido (handle sempre visível). */
export const ROUTES_SHEET_TOP_RESERVE = 56;

const DETENT_ORDER: RoutesSheetDetent[] = ["collapsed", "mid", "expanded"];
const TAP_THRESHOLD_PX = 8;

export type RoutesSheetDetentHeights = Record<RoutesSheetDetent, number> & {
  maxHeight: number;
  minHeight: number;
};

export function getRoutesSheetDetentHeights(
  containerHeight: number,
  topReserve = ROUTES_SHEET_TOP_RESERVE,
): RoutesSheetDetentHeights {
  const usableHeight = Math.max(containerHeight, 0);
  const collapsed = ROUTES_SHEET_RATIO.collapsed * usableHeight;
  const mid = ROUTES_SHEET_RATIO.mid * usableHeight;
  const expandedByRatio = ROUTES_SHEET_RATIO.expanded * usableHeight;
  const maxHeight = Math.max(collapsed, usableHeight - topReserve);
  const expanded = Math.min(expandedByRatio, maxHeight);

  return {
    collapsed,
    expanded,
    maxHeight,
    mid,
    minHeight: collapsed,
  };
}

export function getRoutesSheetDetentHeight(
  detent: RoutesSheetDetent,
  containerHeight: number,
  topReserve = ROUTES_SHEET_TOP_RESERVE,
): number {
  return getRoutesSheetDetentHeights(containerHeight, topReserve)[detent];
}

type RoutesHomeBottomSheetProps = {
  bottomOffset?: number;
  children: ReactNode;
  containerHeight: number;
  detent: RoutesSheetDetent;
  minDetent?: RoutesSheetDetent;
  onDetentChange: (detent: RoutesSheetDetent) => void;
  topReserve?: number;
};

function snapToDetentWithVelocity(
  heightPx: number,
  velocityY: number,
  collapsed: number,
  mid: number,
  expanded: number,
): RoutesSheetDetent {
  "worklet";

  // In react-native-gesture-handler, negative velocityY means moving upwards
  if (velocityY < -400) {
    if (heightPx < mid - 20) {
      return "mid";
    }
    return "expanded";
  }

  // Positive velocityY means moving downwards
  if (velocityY > 400) {
    if (heightPx > mid + 20) {
      return "mid";
    }
    return "collapsed";
  }

  // Moderate upward drag from collapsed: advance to mid if moved noticeably
  if (heightPx > collapsed + 32 && heightPx < mid) {
    return "mid";
  }

  const targets: [RoutesSheetDetent, number][] = [
    ["collapsed", collapsed],
    ["mid", mid],
    ["expanded", expanded],
  ];

  let closest: RoutesSheetDetent = "collapsed";
  let best = Number.POSITIVE_INFINITY;

  for (const [key, target] of targets) {
    const delta = Math.abs(target - heightPx);
    if (delta < best) {
      best = delta;
      closest = key;
    }
  }

  return closest;
}

export function RoutesHomeBottomSheet({
  bottomOffset = 0,
  children,
  containerHeight,
  detent,
  minDetent,
  onDetentChange,
  topReserve = ROUTES_SHEET_TOP_RESERVE,
}: RoutesHomeBottomSheetProps) {
  const styles = useThemedStyles(createStyles);
  const { height: windowHeight } = useWindowDimensions();
  const usableHeight = containerHeight > 0 ? containerHeight : windowHeight * 0.55;

  const detentHeights = useMemo(
    () => getRoutesSheetDetentHeights(usableHeight, topReserve),
    [topReserve, usableHeight],
  );

  const height = useSharedValue(detentHeights[detent]);
  const startHeight = useSharedValue(detentHeights[detent]);
  const [isDragging, setIsDragging] = useState(false);

  const { collapsed, expanded, maxHeight, mid, minHeight } = detentHeights;
  const effectiveMinHeight = minDetent ? detentHeights[minDetent] : minHeight;

  useEffect(() => {
    if (isDragging) return;
    height.value = withTiming(detentHeights[detent], { duration: 280 });
  }, [detent, detentHeights, height, isDragging]);

  const cycleDetent = useCallback(() => {
    const availableDetents = minDetent
      ? DETENT_ORDER.slice(DETENT_ORDER.indexOf(minDetent))
      : DETENT_ORDER;
    const index = availableDetents.indexOf(detent);
    const nextDetent = availableDetents[(index + 1) % availableDetents.length];
    const targetHeight = detentHeights[nextDetent];
    height.value = withTiming(targetHeight, { duration: 260 });
    onDetentChange(nextDetent);
  }, [detent, detentHeights, height, minDetent, onDetentChange]);

  const commitDetent = useCallback(
    (next: RoutesSheetDetent) => {
      setIsDragging(false);
      onDetentChange(next);
    },
    [onDetentChange],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-6, 6])
        .failOffsetX([-25, 25])
        .onBegin(() => {
          startHeight.value = height.value;
          runOnJS(setIsDragging)(true);
        })
        .onUpdate((event) => {
          const next = startHeight.value - event.translationY;
          height.value = Math.min(maxHeight, Math.max(effectiveMinHeight - 16, next));
        })
        .onEnd((event) => {
          const moved = Math.abs(event.translationY) > TAP_THRESHOLD_PX;
          if (!moved) {
            runOnJS(setIsDragging)(false);
            runOnJS(cycleDetent)();
            return;
          }

          let nextDetent = snapToDetentWithVelocity(
            height.value,
            event.velocityY,
            collapsed,
            mid,
            expanded,
          );
          if (minDetent) {
            const minIndex = DETENT_ORDER.indexOf(minDetent);
            const nextIndex = DETENT_ORDER.indexOf(nextDetent);
            if (nextIndex < minIndex) {
              nextDetent = minDetent;
            }
          }

          height.value = withTiming(
            nextDetent === "collapsed" ? collapsed : nextDetent === "mid" ? mid : expanded,
            { duration: 240 },
          );
          runOnJS(commitDetent)(nextDetent);
        })
        .onFinalize(() => {
          runOnJS(setIsDragging)(false);
        }),
    [
      collapsed,
      commitDetent,
      cycleDetent,
      effectiveMinHeight,
      expanded,
      height,
      maxHeight,
      mid,
      minDetent,
      startHeight,
    ],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(350)
        .onEnd(() => {
          runOnJS(cycleDetent)();
        }),
    [cycleDetent],
  );

  const handleGesture = useMemo(
    () => Gesture.Exclusive(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.sheet, sheetStyle, { bottom: bottomOffset }]}>
      <GestureDetector gesture={handleGesture}>
        <View
          accessibilityHint="Toque para alternar o tamanho ou arraste para deslizar"
          accessibilityLabel="Barra do painel de rotas"
          accessibilityRole="button"
          hitSlop={{ bottom: 20, left: 40, right: 40, top: 16 }}
          style={styles.handleArea}
        >
          <View style={styles.handle} />
        </View>
      </GestureDetector>

      <View style={styles.body}>{children}</View>
    </Animated.View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    body: {
      flex: 1,
      minHeight: 0,
    },
    handle: {
      alignSelf: "center",
      backgroundColor: colors.border.default,
      borderRadius: 999,
      height: 5,
      width: 44,
    },
    handleArea: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
      paddingBottom: 10,
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    sheet: {
      backgroundColor: colors.surface.primary,
      borderTopColor: colors.border.subtle,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderTopWidth: 1,
      elevation: 16,
      left: 0,
      overflow: "hidden",
      position: "absolute",
      right: 0,
      shadowColor: colors.text.primary,
      shadowOffset: { height: -18, width: 0 },
      shadowOpacity: 0.12,
      shadowRadius: 40,
      zIndex: 20,
    },
  });
