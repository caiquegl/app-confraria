import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useKeyboardState } from "react-native-keyboard-controller";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEnvironmentBannerInset } from "@/components/EnvironmentBanner";
import { type AppColors, useThemedStyles } from "@/theme";

import type { SheetState } from "../types/route-create.types";
import {
  cycleSheetState,
  getPlannerSheetDetentHeights,
  getSheetHeight,
} from "../utils/route-day.utils";

const TAP_THRESHOLD_PX = 8;

type RoutePlannerSheetProps = {
  bottomInset?: number;
  children: ReactNode;
  footer?: ReactNode;
  onKeyboardShow?: () => void;
  onSheetStateChange: (state: SheetState) => void;
  sheetState: SheetState;
  stepper: ReactNode;
};

function snapToSheetState(
  heightPx: number,
  compact: number,
  normal: number,
  full: number,
): SheetState {
  "worklet";

  const targets: [SheetState, number][] = [
    ["compact", compact],
    ["normal", normal],
    ["full", full],
  ];

  let closest: SheetState = "compact";
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

export function RoutePlannerSheet({
  bottomInset = 0,
  children,
  footer,
  onKeyboardShow,
  onSheetStateChange,
  sheetState,
  stepper,
}: RoutePlannerSheetProps) {
  const styles = useThemedStyles(createStyles);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bannerInset = useEnvironmentBannerInset();
  const topInset = insets.top + bannerInset;
  const keyboardHeight = useKeyboardState((state) =>
    state.isVisible ? state.height : 0,
  );
  const restWindowHeightRef = useRef(windowHeight);
  const [isDragging, setIsDragging] = useState(false);

  if (keyboardHeight === 0) {
    restWindowHeightRef.current = windowHeight;
  }

  const windowAlreadyResized =
    keyboardHeight > 0 && windowHeight < restWindowHeightRef.current - 80;
  const bottomOffset = windowAlreadyResized ? 0 : keyboardHeight;
  const availableHeight = Math.max(windowHeight - bottomOffset - topInset, 0);
  const effectiveBottomInset = bottomOffset > 0 ? 0 : bottomInset;

  const detentHeights = useMemo(
    () => getPlannerSheetDetentHeights(windowHeight, effectiveBottomInset, topInset),
    [effectiveBottomInset, topInset, windowHeight],
  );

  const { compact, full, maxHeight, minHeight, normal } = detentHeights;

  const desiredHeight = getSheetHeight(
    windowHeight,
    sheetState,
    effectiveBottomInset,
    topInset,
  );
  const sheetHeight =
    bottomOffset > 0 ? Math.min(desiredHeight, availableHeight) : desiredHeight;

  const height = useSharedValue(sheetHeight);
  const startHeight = useSharedValue(sheetHeight);

  useEffect(() => {
    if (keyboardHeight > 0) {
      onKeyboardShow?.();
    }
  }, [keyboardHeight, onKeyboardShow]);

  useEffect(() => {
    if (isDragging) return;
    height.value = withTiming(sheetHeight, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [height, isDragging, sheetHeight]);

  const cycleDetent = useCallback(() => {
    onSheetStateChange(cycleSheetState(sheetState));
  }, [onSheetStateChange, sheetState]);

  const commitDetent = useCallback(
    (next: SheetState) => {
      setIsDragging(false);
      onSheetStateChange(next);
    },
    [onSheetStateChange],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          startHeight.value = height.value;
          runOnJS(setIsDragging)(true);
        })
        .onUpdate((event) => {
          const next = startHeight.value - event.translationY;
          height.value = Math.min(maxHeight, Math.max(minHeight - 16, next));
        })
        .onEnd((event) => {
          const moved = Math.abs(event.translationY) > TAP_THRESHOLD_PX;
          if (!moved) {
            runOnJS(setIsDragging)(false);
            runOnJS(cycleDetent)();
            return;
          }

          const nextDetent = snapToSheetState(height.value, compact, normal, full);
          const nextHeight =
            nextDetent === "compact" ? compact : nextDetent === "normal" ? normal : full;

          height.value = withTiming(nextHeight, {
            duration: 240,
            easing: Easing.out(Easing.cubic),
          });
          runOnJS(commitDetent)(nextDetent);
        })
        .onFinalize(() => {
          runOnJS(setIsDragging)(false);
        }),
    [
      commitDetent,
      compact,
      cycleDetent,
      full,
      height,
      maxHeight,
      minHeight,
      normal,
      startHeight,
    ],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.sheet, sheetStyle, { bottom: bottomOffset }]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>
      </GestureDetector>

      <View style={styles.stepperWrap}>{stepper}</View>

      <View style={styles.body}>
        <View style={styles.content}>{children}</View>

        {footer ? (
          <View
            style={[
              styles.footer,
              {
                paddingBottom:
                  bottomOffset > 0 || windowAlreadyResized
                    ? 16
                    : Math.max(bottomInset, 16),
              },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    body: {
      flex: 1,
      minHeight: 0,
    },
    content: {
      flex: 1,
      minHeight: 0,
    },
    footer: {
      backgroundColor: colors.map.frosted,
      borderTopColor: colors.border.subtle,
      borderTopWidth: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    handle: {
      backgroundColor: colors.border.default,
      borderRadius: 999,
      height: 4,
      width: 40,
    },
    handleArea: {
      alignItems: "center",
      borderBottomColor: colors.border.subtle,
      borderBottomWidth: 1,
      paddingBottom: 12,
      paddingTop: 12,
    },
    sheet: {
      backgroundColor: colors.map.frosted,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      bottom: 0,
      elevation: 2000,
      left: 0,
      overflow: "hidden",
      position: "absolute",
      right: 0,
      shadowColor: colors.text.primary,
      shadowOffset: { height: -8, width: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      zIndex: 2000,
    },
    stepperWrap: {
      borderBottomColor: colors.border.subtle,
      borderBottomWidth: 1,
      paddingBottom: 8,
      paddingHorizontal: 24,
      paddingTop: 4,
    },
  });
