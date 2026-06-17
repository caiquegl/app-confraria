import { useEffect, useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

const TRACK_WIDTH = 96;

export function LoadingBar() {
  const progress = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  // espelha o keyframe CSS:
  // 0%   → width 0,   translateX(-100%)
  // 50%  → width 100%, translateX(0)
  // 100% → width 0,   translateX(+100%)
  const scaleX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-TRACK_WIDTH / 2, 0, TRACK_WIDTH / 2],
  });

  return (
    <View style={styles.track}>
      <Animated.View
        style={[styles.bar, { transform: [{ scaleX }, { translateX }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.brandDark,
    height: "100%",
    width: TRACK_WIDTH,
  },
  track: {
    backgroundColor: `${colors.brandDark}1A`,
    borderRadius: 999,
    height: 4,
    marginTop: 16,
    overflow: "hidden",
    width: TRACK_WIDTH,
  },
});
