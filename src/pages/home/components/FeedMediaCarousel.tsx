import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
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

import type { FeedPostMedia } from "../types/feed.types";
import {
  pauseVideoPlayer,
  playVideoPlayer,
  setVideoPlayerMuted,
} from "../utils/video-player-controls";

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
                <FeedVideoSlide
                  active={activeIndex === index}
                  height={slideHeight}
                  uri={item.url}
                />
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
              <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            </Pressable>
          )}

          {activeIndex < media.length - 1 && (
            <Pressable
              style={[styles.arrow, styles.arrowRight]}
              hitSlop={8}
              onPress={() => scrollToIndex(activeIndex + 1)}
            >
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function FeedVideoSlide({
  active,
  height,
  uri,
}: {
  active: boolean;
  height: number;
  uri: string;
}) {
  const [isMuted, setIsMuted] = useState(true);
  const player = useVideoPlayer({ uri, useCaching: true }, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (active) {
      playVideoPlayer(player);
      return;
    }

    pauseVideoPlayer(player);
  }, [active, player]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setVideoPlayerMuted(player, nextMuted);
  };

  return (
    <View style={[styles.videoContainer, { height }]}>
      <VideoView
        contentFit="contain"
        nativeControls={false}
        player={player}
        style={[styles.video, { height }]}
      />
      <Pressable
        accessibilityLabel={isMuted ? "Ativar áudio do vídeo" : "Mutar áudio do vídeo"}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.muteButton}
        onPress={(event) => {
          event.stopPropagation();
          toggleMute();
        }}
      >
        <Ionicons
          name={isMuted ? "volume-mute" : "volume-high"}
          size={18}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
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
    backgroundColor: "#FFFFFF",
    width: 20,
  },
  dotIdle: {
    backgroundColor: "rgba(255,255,255,0.55)",
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
    backgroundColor: "#E5E7EB",
    width: CARD_WIDTH,
  },
  muteButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    bottom: 12,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    width: 38,
  },
  slide: {
    width: CARD_WIDTH,
  },
  video: {
    width: CARD_WIDTH,
  },
  videoContainer: {
    alignItems: "center",
    backgroundColor: "#000000",
    justifyContent: "center",
    width: CARD_WIDTH,
  },
  wrapper: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
});
