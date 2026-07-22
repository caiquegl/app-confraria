import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
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
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const animatedHeight = useSharedValue(
    getSheetHeight(windowHeight, "normal", bottomInset, topInset),
  );

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOffset(event.endCoordinates.height);
      onKeyboardShow?.();
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [onKeyboardShow]);

  useEffect(() => {
    animatedHeight.value = withTiming(
      getSheetHeight(windowHeight, sheetState, bottomInset, topInset),
      {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      },
    );
  }, [animatedHeight, bottomInset, sheetState, topInset, windowHeight]);

  const sheetStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
  }));

  return (
    <Animated.View style={[styles.sheet, sheetStyle, { bottom: keyboardOffset }]}>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.keyboardAvoiding}
      >
        <View style={styles.content}>{children}</View>

        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, 16) }]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  keyboardAvoiding: {
    flex: 1,
    minHeight: 0,
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
