import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { FeedPostMedia } from "../types/feed.types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 32;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING;
const DEFAULT_MEDIA_HEIGHT = Math.round(CARD_WIDTH * 0.75);

type FeedMediaCarouselProps = {
  media: FeedPostMedia[];
  onDoublePress?: () => void;
  title: string;
};

function resolveImageHeight(width: number, height: number): number {
  if (!width || !height) return DEFAULT_MEDIA_HEIGHT;
  return Math.round((CARD_WIDTH / width) * height);
}

export function FeedMediaCarousel({ media, onDoublePress, title }: FeedMediaCarouselProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState<Record<number, number>>({});
  const scrollRef = useRef<ScrollView>(null);
  const lastPressAtRef = useRef(0);

  if (media.length === 0) return null;

  const activeHeight = imageHeights[activeIndex] ?? DEFAULT_MEDIA_HEIGHT;

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, media.length - 1));
    scrollRef.current?.scrollTo({ animated: true, x: CARD_WIDTH * clamped });
    setActiveIndex(clamped);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(nextIndex);
  };

  const handleImageLoad = (index: number, width?: number | null, height?: number | null) => {
    if (!width || !height) return;

    setImageHeights((current) => ({
      ...current,
      [index]: resolveImageHeight(width, height),
    }));
  };

  const handleMediaPress = () => {
    const now = Date.now();

    if (now - lastPressAtRef.current < 280) {
      lastPressAtRef.current = 0;
      onDoublePress?.();
      return;
    }

    lastPressAtRef.current = now;
  };

  return (
    <View style={[styles.wrapper, { height: activeHeight }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {media.map((item, index) => {
          const slideHeight = imageHeights[index] ?? activeHeight;

          return (
            <Pressable
              key={`${item.url}-${index}`}
              accessibilityLabel={`Mídia ${index + 1} de ${title}. Toque duas vezes para curtir ou descurtir.`}
              accessibilityRole="imagebutton"
              style={[styles.slide, { height: slideHeight }]}
              onPress={handleMediaPress}
            >
              {item.mediaType === "video" ? (
                <FeedVideoPoster height={slideHeight} thumbnailUrl={item.thumbnailUrl} />
              ) : (
                <Image
                  source={{ uri: item.url }}
                  style={[styles.image, { height: slideHeight }]}
                  cachePolicy="memory-disk"
                  contentFit="contain"
                  recyclingKey={item.url}
                  onLoad={({ source }) => handleImageLoad(index, source.width, source.height)}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {media.length > 1 && (
        <>
          <View style={styles.dots}>
            {media.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotIdle]}
              />
            ))}
          </View>

          {activeIndex > 0 && (
            <Pressable
              style={[styles.arrow, styles.arrowLeft]}
              hitSlop={8}
              onPress={() => scrollToIndex(activeIndex - 1)}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text.inverse} />
            </Pressable>
          )}

          {activeIndex < media.length - 1 && (
            <Pressable
              style={[styles.arrow, styles.arrowRight]}
              hitSlop={8}
              onPress={() => scrollToIndex(activeIndex + 1)}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text.inverse} />
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function FeedVideoPoster({
  height,
  thumbnailUrl,
}: {
  height: number;
  thumbnailUrl?: string | null;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.videoContainer, { height }]}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={[styles.video, { height }]}
          cachePolicy="memory-disk"
          contentFit="contain"
          recyclingKey={thumbnailUrl}
        />
      ) : (
        <View style={[styles.video, styles.videoFallback, { height }]} />
      )}
      <View style={styles.playBadge} pointerEvents="none">
        <Ionicons name="play" size={22} color={colors.text.inverse} />
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    arrow: {
      alignItems: "center",
      backgroundColor: colors.overlay.scrimLight,
      borderRadius: 18,
      height: 36,
      justifyContent: "center",
      position: "absolute",
      top: "50%",
      width: 36,
    },
    arrowLeft: {
      left: 12,
    },
    arrowRight: {
      right: 12,
    },
    dot: {
      borderRadius: 999,
      height: 6,
    },
    dotActive: {
      backgroundColor: colors.surface.primary,
      width: 20,
    },
    dotIdle: {
      backgroundColor: colors.overlay.dotIdle,
      width: 6,
    },
    dots: {
      alignItems: "center",
      bottom: 12,
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
    },
    image: {
      backgroundColor: colors.border.subtle,
      width: CARD_WIDTH,
    },
    playBadge: {
      alignItems: "center",
      backgroundColor: colors.overlay.scrimMedium,
      borderRadius: 999,
      height: 48,
      justifyContent: "center",
      left: "50%",
      marginLeft: -24,
      marginTop: -24,
      position: "absolute",
      top: "50%",
      width: 48,
    },
    slide: {
      width: CARD_WIDTH,
    },
    video: {
      width: CARD_WIDTH,
    },
    videoContainer: {
      alignItems: "center",
      backgroundColor: colors.surface.video,
      justifyContent: "center",
      width: CARD_WIDTH,
    },
    videoFallback: {
      backgroundColor: colors.surface.videoFallback,
    },
    wrapper: {
      backgroundColor: colors.border.subtle,
      overflow: "hidden",
      position: "relative",
    },
  });
