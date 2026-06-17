import { useEffect, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

function SkeletonBlock({ height, style, width }: { height: number; style?: object; width?: number | `${number}%` }) {
  const opacity = useMemo(() => new Animated.Value(0.35), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 700,
          toValue: 0.75,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 700,
          toValue: 0.35,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        { height, opacity, width: width ?? "100%" },
        style,
      ]}
    />
  );
}

export function FeedCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonBlock height={44} width={44} style={styles.avatar} />
        <View style={styles.headerText}>
          <SkeletonBlock height={14} width="55%" />
          <SkeletonBlock height={12} style={styles.headerMeta} width="35%" />
        </View>
      </View>

      <SkeletonBlock height={220} style={styles.media} />

      <View style={styles.footer}>
        <SkeletonBlock height={12} width="80%" />
        <SkeletonBlock height={12} style={styles.footerGap} width="45%" />
      </View>
    </View>
  );
}

export function FeedListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <FeedCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 22,
  },
  block: {
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    elevation: 2,
    overflow: "hidden",
    shadowColor: colors.brandDark,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  footer: {
    padding: 12,
  },
  footerGap: {
    marginTop: 8,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  headerMeta: {
    marginTop: 8,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  list: {
    gap: 14,
  },
  media: {
    borderRadius: 0,
  },
});
