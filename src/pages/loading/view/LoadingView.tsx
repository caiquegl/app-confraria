import { useEffect, useMemo } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

import { colors } from "@/theme/colors";

import { useLoading } from "../business/useLoading";
import { ConfraLogo } from "../components/ConfraLogo";
import { LoadingBar } from "../components/LoadingBar";
import type { LoadingViewProps } from "../types/loading.types";

export function LoadingView({ onComplete }: LoadingViewProps) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(0.92), []);

  useLoading({ onComplete });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View style={styles.screen}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <ConfraLogo />
        <LoadingBar />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
  },
  screen: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
});
