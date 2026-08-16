import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEnvironmentBannerInset } from "@/components/EnvironmentBanner";

import type { SheetState } from "../types/route-create.types";
import { getSheetHeight } from "../utils/route-day.utils";

type RoutePlannerSheetProps = {
  bottomInset?: number;
  children: ReactNode;
  footer?: ReactNode;
  onKeyboardShow?: () => void;
  onToggleSize: () => void;
  sheetState: SheetState;
  stepper: ReactNode;
};

export function RoutePlannerSheet({
  bottomInset = 0,
  children,
  footer,
  onKeyboardShow,
  onToggleSize,
  sheetState,
  stepper,
}: RoutePlannerSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bannerInset = useEnvironmentBannerInset();
  const topInset = insets.top + bannerInset;
  const keyboardHeight = useKeyboardState((state) =>
    state.isVisible ? state.height : 0,
  );
  const restWindowHeightRef = useRef(windowHeight);
  const animatedHeight = useSharedValue(
    getSheetHeight(windowHeight, "normal", bottomInset, topInset),
  );

  if (keyboardHeight === 0) {
    restWindowHeightRef.current = windowHeight;
  }

  const windowAlreadyResized =
    keyboardHeight > 0 && windowHeight < restWindowHeightRef.current - 80;
  const bottomOffset = windowAlreadyResized ? 0 : keyboardHeight;
  const availableHeight = Math.max(windowHeight - bottomOffset - topInset, 0);
  const desiredHeight = getSheetHeight(
    windowHeight,
    sheetState,
    bottomOffset > 0 ? 0 : bottomInset,
    topInset,
  );
  const sheetHeight =
    bottomOffset > 0 ? Math.min(desiredHeight, availableHeight) : desiredHeight;

  useEffect(() => {
    if (keyboardHeight > 0) {
      onKeyboardShow?.();
    }
  }, [keyboardHeight, onKeyboardShow]);

  useEffect(() => {
    animatedHeight.value = withTiming(sheetHeight, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedHeight, sheetHeight]);

  const sheetStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
  }));

  return (
    <Animated.View style={[styles.sheet, sheetStyle, { bottom: bottomOffset }]}>
      <Pressable
        accessibilityLabel="Alternar tamanho do painel"
        accessibilityRole="button"
        hitSlop={12}
        style={styles.handleArea}
        onPress={onToggleSize}
      >
        <View style={styles.handle} />
      </Pressable>

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

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  handle: {
    backgroundColor: "#D1D5DB",
    borderRadius: 999,
    height: 4,
    width: 40,
  },
  handleArea: {
    alignItems: "center",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingTop: 12,
  },
  sheet: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    bottom: 0,
    elevation: 2000,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    shadowColor: "#1C2126",
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    zIndex: 2000,
  },
  stepperWrap: {
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
});
