import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { appLog } from "@/lib/app-log";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { FeedPostMedia } from "../types/feed.types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 32;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING;
/** Alinhado ao preview do composer (Instagram portrait). */
const MEDIA_ASPECT_RATIO = 4 / 5;
/** Altura explícita — % dentro de ScrollView horizontal colapsa em RN. */
const MEDIA_HEIGHT = Math.round(CARD_WIDTH / MEDIA_ASPECT_RATIO);

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
  const loggedEmptyRef = useRef(false);

  if (media.length === 0) {
    if (!loggedEmptyRef.current) {
      loggedEmptyRef.current = true;
      appLog.warn("feed.media.empty", { title });
    }
    return null;
  }

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, media.length - 1));
    scrollRef.current?.scrollTo({ animated: true, x: CARD_WIDTH * clamped });
    setActiveIndex(clamped);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(nextIndex);
  };

  const handleMediaPress = (onSinglePress?: () => void) => {
    const now = Date.now();

    if (now - lastPressAtRef.current < 280) {
      lastPressAtRef.current = 0;
      onDoublePress?.();
      return;
    }

    lastPressAtRef.current = now;
    if (onSinglePress) {
      setTimeout(() => {
        if (lastPressAtRef.current === now) {
          onSinglePress();
        }
      }, 280);
    }
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
          <View key={`${item.url}-${index}`} style={styles.slide}>
            {item.mediaType === "video" ? (
              <FeedVideoSlide
                isActive={index === activeIndex}
                item={item}
                title={title}
                onPressMedia={handleMediaPress}
              />
            ) : (
              <Pressable
                accessibilityLabel={`Mídia ${index + 1} de ${title}. Toque duas vezes para curtir ou descurtir.`}
                accessibilityRole="imagebutton"
                style={styles.imagePressable}
                onPress={() => handleMediaPress()}
              >
                <Image
                  source={{ uri: item.url }}
                  style={styles.image}
                  cachePolicy="memory-disk"
                  contentFit="contain"
                  recyclingKey={item.url}
                  onError={() => {
                    appLog.warn("feed.media.load_failed", {
                      index,
                      mediaType: item.mediaType,
                      title,
                      urlHost: safeUrlHost(item.url),
                    });
                  }}
                  onLoad={() => {
                    if (index === 0) {
                      appLog.info("feed.media.load_ok", {
                        count: media.length,
                        height: MEDIA_HEIGHT,
                        title,
                        width: CARD_WIDTH,
                      });
                    }
                  }}
                />
              </Pressable>
            )}
          </View>
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

function FeedVideoSlide({
  isActive,
  item,
  onPressMedia,
  title,
}: {
  isActive: boolean;
  item: FeedPostMedia;
  onPressMedia: (onSinglePress?: () => void) => void;
  title: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlayback = () => {
    setIsPlaying((current) => !current);
  };

  return (
    <Pressable
      accessibilityLabel={`Vídeo de ${title}. Toque para reproduzir. Toque duas vezes para curtir.`}
      accessibilityRole="button"
      style={styles.videoContainer}
      onPress={() => onPressMedia(togglePlayback)}
    >
      {isPlaying && isActive ? (
        <FeedVideoPlayer url={item.url} />
      ) : (
        <FeedVideoPoster thumbnailUrl={item.thumbnailUrl} />
      )}
      {!isPlaying && (
        <View style={styles.playBadge} pointerEvents="none">
          <Ionicons name="play" size={22} color={colors.text.inverse} />
        </View>
      )}
    </Pressable>
  );
}

function FeedVideoPlayer({ url }: { url: string }) {
  const styles = useThemedStyles(createStyles);
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = true;
    instance.play();
  });

  useEffect(() => {
    player.play();
    return () => {
      player.pause();
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

function FeedVideoPoster({ thumbnailUrl }: { thumbnailUrl?: string | null }) {
  const styles = useThemedStyles(createStyles);

  return thumbnailUrl ? (
    <Image
      source={{ uri: thumbnailUrl }}
      style={styles.video}
      cachePolicy="memory-disk"
      contentFit="contain"
      recyclingKey={thumbnailUrl}
      onError={() => {
        appLog.warn("feed.media.video_thumb_failed", {
          urlHost: safeUrlHost(thumbnailUrl),
        });
      }}
    />
  ) : (
    <View style={[styles.video, styles.videoFallback]} />
  );
}

function safeUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid";
  }
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
      backgroundColor: colors.surface.media,
      height: MEDIA_HEIGHT,
      width: CARD_WIDTH,
    },
    imagePressable: {
      flex: 1,
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
      height: MEDIA_HEIGHT,
    },
    slide: {
      height: MEDIA_HEIGHT,
      width: CARD_WIDTH,
    },
    video: {
      height: MEDIA_HEIGHT,
      width: CARD_WIDTH,
    },
    videoContainer: {
      alignItems: "center",
      backgroundColor: colors.surface.video,
      height: MEDIA_HEIGHT,
      justifyContent: "center",
      width: CARD_WIDTH,
    },
    videoFallback: {
      backgroundColor: colors.surface.videoFallback,
    },
    wrapper: {
      backgroundColor: colors.surface.media,
      height: MEDIA_HEIGHT,
      overflow: "hidden",
      position: "relative",
      width: CARD_WIDTH,
    },
  });
