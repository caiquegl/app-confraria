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
/** Alinhado ao preview do composer (Instagram portrait). */
const MEDIA_ASPECT_RATIO = 4 / 5;

type FeedMediaCarouselProps = {
  media: FeedPostMedia[];
  onDoublePress?: () => void;
  title: string;
};

export function FeedMediaCarousel({ media, onDoublePress, title }: FeedMediaCarouselProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const lastPressAtRef = useRef(0);

  if (media.length === 0) return null;

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, media.length - 1));
    scrollRef.current?.scrollTo({ animated: true, x: CARD_WIDTH * clamped });
    setActiveIndex(clamped);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(nextIndex);
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
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        style={styles.scroll}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {media.map((item, index) => (
          <Pressable
            key={`${item.url}-${index}`}
            accessibilityLabel={`Mídia ${index + 1} de ${title}. Toque duas vezes para curtir ou descurtir.`}
            accessibilityRole="imagebutton"
            style={styles.slide}
            onPress={handleMediaPress}
          >
            {item.mediaType === "video" ? (
              <FeedVideoPoster thumbnailUrl={item.thumbnailUrl} />
            ) : (
              <Image
                source={{ uri: item.url }}
                style={styles.image}
                cachePolicy="memory-disk"
                contentFit="contain"
                recyclingKey={item.url}
              />
            )}
          </Pressable>
        ))}
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

function FeedVideoPoster({ thumbnailUrl }: { thumbnailUrl?: string | null }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.videoContainer}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.video}
          cachePolicy="memory-disk"
          contentFit="contain"
          recyclingKey={thumbnailUrl}
        />
      ) : (
        <View style={[styles.video, styles.videoFallback]} />
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
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.surface.media,
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
    scroll: {
      flex: 1,
    },
    slide: {
      height: "100%",
      width: CARD_WIDTH,
    },
    video: {
      ...StyleSheet.absoluteFillObject,
    },
    videoContainer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      backgroundColor: colors.surface.video,
      justifyContent: "center",
    },
    videoFallback: {
      backgroundColor: colors.surface.videoFallback,
    },
    wrapper: {
      aspectRatio: MEDIA_ASPECT_RATIO,
      backgroundColor: colors.surface.media,
      overflow: "hidden",
      position: "relative",
      width: CARD_WIDTH,
    },
  });
